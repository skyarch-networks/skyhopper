#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class AppSettingsController < ApplicationController
  before_action except: [:edit_zabbix, :update_zabbix] do
    if AppSetting.set?
      redirect_to root_path
    end
  end

  class AppSettingError < ::StandardError; end

  # GET /app_settings
  def show
  end


  # POST /app_settings/create
  def create
    settings = JSON.parse(params.require(:settings), symbolize_names: true)
    access_key        = settings.delete(:access_key)
    secret_access_key = settings.delete(:secret_access_key)
    keypair_name      = settings.delete(:keypair_name)
    keypair_value     = settings.delete(:keypair_value)

    check_eip_limit!(settings[:aws_region], access_key, secret_access_key)

    ec2key = Ec2PrivateKey.create!(
      name:  keypair_name,
      value: keypair_value
    )

    settings[:ec2_private_key_id] = ec2key.id

    AppSetting.clear_dummy
    app_setting = AppSetting.new(settings)
    app_setting.zabbix_fqdn = DummyText
    app_setting.save!
    AppSetting.clear_cache


    projects = Project.for_system
    projects.each do |project|
      project.update!(access_key: access_key, secret_access_key: secret_access_key)
    end

    Thread.new_with_db do
      # おまじない
      # rubocop:disable Lint/Void
      ChefServer
      ChefServer::Deployment
      CfTemplate
      # rubocop:enable Lint/Void

      set = AppSetting.get
      stack_name = "SkyHopperZabbixServer-#{Digest::MD5.hexdigest(DateTime.now.in_time_zone.to_s)}"

      ChefServer::Deployment.create_zabbix(stack_name, set.aws_region, set.ec2_private_key.name, set.ec2_private_key.value)
    end

    render text: I18n.t('app_settings.msg.created') and return
  end

  # POST /app_settings/generate
  def generate_key
    access_key         = params.require(:access_key)
    secret_access_key  = params.require(:secret_access_key)
    region             = params.require(:region)
    name               = params.require(:name)


    begin
      ec2 = AppSetting.ec2_client(access_key, secret_access_key, region)
      key = ec2.create_key_pair(key_name: name)
    rescue => ex
      render text: ex.message, status: 500 and return
    end

    render json: key
  end

  # GET /app_settings/edit_zabbix
  def edit_zabbix
    @app_setting = AppSetting.get
    render 'zabbix_server'
  end

  def update_zabbix
    app_setting = AppSetting.get
    user = params.require(:zabbix_user)
    pass = params.require(:zabbix_pass)

    app_setting.update!(zabbix_user: user, zabbix_pass: pass)
    AppSetting.clear_cache

    redirect_to clients_path, notice: I18n.t('app_settings.msg.zabbix_updated')
  end


    # POST /app_settings/chef_create
    def chef_create
      # とりあえず決め打ちでいい気がする
      # stack_name = params.require(:stack_name)
      stack_name = "SkyHopperChefServer-#{Digest::MD5.hexdigest(DateTime.now.in_time_zone.to_s)}"

      set = AppSetting.first
      region        = set.aws_region
      keypair_name  = set.ec2_private_key.name
      keypair_value = set.ec2_private_key.value
      @locale = I18n.locale
      # おまじない
      # rubocop:disable Lint/Void
      ChefServer
      ChefServer::Deployment
      CfTemplate
      # rubocop:enable Lint/Void

      Thread.new_with_db do
        ws = WSConnector.new('chef_server_deployment', 'status')

        begin
          ChefServer::Deployment.create(stack_name, region, keypair_name, keypair_value) do |data, msg|
            Rails.logger.debug("ChefServer creating > #{data} #{msg}")
            ws.push(build_ws_message(data, msg))
          end

          cmd = []
          cmd << "cp -r #{Rails.root.join('tmp', 'chef')} ~/.chef \n"
          cmd << "git clone https://github.com/skyarch-networks/skyhopper_cookbooks.git #{Rails.root.join('../', 'skyhopper_cookbooks')} \n"
          cmd << "knife cookbook upload -ao #{Rails.root.join('../', 'skyhopper_cookbooks')}/cookbooks/ \n"
          cmd << "knife role from file  #{Rails.root.join('../', 'skyhopper_cookbooks')}/roles/*rb \n"
          cmd = cmd.flatten.reject(&:blank?).join(" ")

          # Execute given command on Copying chef keys and uploading cookbooks
          Node.exec_command(cmd)
          Rails.logger.info("SkyHopper setup > Running necessary Scripts")
          zabbix = Project.for_zabbix_server.infrastructures.first
          physical_id = zabbix.resources.first.physical_id
          fqdn = zabbix.instance(physical_id).fqdn
          # BOOTSTRAP node
          Node.bootstrap(fqdn, physical_id, zabbix)
          node = Node.new(physical_id)
          node.wait_search_index

          # Update runlist into Role[zabbix_server]
          node.update_runlist(["role[zabbix_server]"])

          #Start cooking
          begin
            tries ||= 3
            node.cook(zabbix, false) do |line|
              Rails.logger.info "cooking #{physical_id} > #{line}"
            end

          rescue Node::CookError
            retry unless (tries -= 1).zero?
          end

          # Save status to success after cooking
          zabbix.resources.first.status.cook.success!

          # Restart Rails Server
          Rails.logger.info "Restarting Skyhopper after cook"
          if Rails.env.production?
            rails_cmd = "nohup #{Rails.root.join('scripts')}/skyhopper_daemon.sh start"
            outs = Node.exec_command(rails_cmd)
            Rails.logger.info "executing: #{outs}"
          end

          Rails.logger.debug("ChefServer creating > complete")
          ws.push(build_ws_message(:complete))
        rescue => ex
          Rails.logger.error(ex.message)
          Rails.logger.error(ex.backtrace)
          ws.push(build_ws_message(:error, ex.message))
        end
      end

      render text: build_ws_message(:creating_infra)
    end

  private

  # statusに対応するメッセージをJSONとして返す
  # {
  #   percentage: 0..100 (Int) or null(when error),
  #   status:     'in_progress' or 'complete' or 'error' (String),
  #   message:    I18ned String
  # }
  def build_ws_message(status, msg = nil)
    hash = ChefServer::Deployment::Progress[status].dup
    I18n.locale = @locale
    hash[:message] = msg || I18n.t("chef_servers.msg.#{status}")
    return JSON.generate(hash)
  end

  class EIPLimitError < StandardError; end

  # @param [String] region
  # @param [String] access_key_id
  # @param [String] secret_access_key
  # @raise [EIPLimitError] raise error when cann't allocate EIP.
  def check_eip_limit!(region, access_key_id, secret_access_key)
    e = Aws::EC2::Client.new(region: region, access_key_id: access_key_id, secret_access_key: secret_access_key)
    a = e.describe_account_attributes
    limit = a.account_attributes.find{|x| x.attribute_name == 'vpc-max-elastic-ips'}.attribute_values.first.attribute_value.to_i
    n = e.describe_addresses.addresses.size
    if limit - n < 2
      raise EIPLimitError, I18n.t('app_settings.msg.eip_limit_error')
    end
  end
end
