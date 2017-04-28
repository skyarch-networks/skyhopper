#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class AppSettingsController < ApplicationController
  before_action :authenticate_user!, except: [:show, :create, :chef_create]

  before_action except: [:edit_zabbix, :update_zabbix, :chef_server, :chef_keys] do
    if AppSetting.set?
      redirect_to root_path
    end
  end

  CF_PARAMS_KEY = 'cf_params'.freeze

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

    vpc_id    = settings.delete(:vpc_id)
    subnet_id = settings.delete(:subnet_id)

    set_ec2(settings[:aws_region], access_key, secret_access_key)

    verify_vpc_id!(vpc_id) if vpc_id
    verify_subnet_id!(subnet_id) if subnet_id

    check_eip_limit!

    cf_params = {
      VpcId:    vpc_id,
      SubnetId: subnet_id,
    }
    Rails.cache.write(CF_PARAMS_KEY, cf_params)

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

      ChefServer::Deployment.create_zabbix(stack_name, set.aws_region, set.ec2_private_key.name, set.ec2_private_key.value, cf_params)
    end

    render text: I18n.t('app_settings.msg.created') and return
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

    cf_params = Rails.cache.fetch(CF_PARAMS_KEY) || {}
    Rails.cache.delete(CF_PARAMS_KEY)

    Thread.new_with_db do
      ws = WSConnector.new('chef_server_deployment', 'status')

      begin
        ChefServer::Deployment.create(stack_name, region, keypair_name, keypair_value, cf_params) do |data, msg|
          Rails.logger.debug("ChefServer creating > #{data} #{msg}")
          ws.push(build_ws_message(data, msg))
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

  # GET /app_settings/chef_keys
  def chef_keys
    prepare_chef_key_zip
    send_file(@zipfile.path, filename: 'chef_keys.zip')
    @zipfile.close
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

  def set_ec2(region, access_key_id, secret_access_key)
    @ec2 = Aws::EC2::Client.new(region: region, access_key_id: access_key_id, secret_access_key: secret_access_key)
  end

  class EIPLimitError < StandardError; end

  # @param [String] region
  # @param [String] access_key_id
  # @param [String] secret_access_key
  # @raise [EIPLimitError] raise error when cann't allocate EIP.
  def check_eip_limit!
    a = @ec2.describe_account_attributes
    limit = a.account_attributes.find{|x| x.attribute_name == 'vpc-max-elastic-ips'}.attribute_values.first.attribute_value.to_i
    n = @ec2.describe_addresses.addresses.size
    if limit - n < 2
      raise EIPLimitError, I18n.t('app_settings.msg.eip_limit_error')
    end
  end

  def verify_vpc_id!(vpc_id)
    @ec2.describe_vpcs(vpc_ids: [vpc_id])
  end

  def verify_subnet_id!(subnet_id)
    @ec2.describe_subnets(subnet_ids: [subnet_id])
  end

  def prepare_chef_key_zip
    @zipfile = Tempfile.open('chef')
    zf = ZipFileGenerator.new(File.expand_path('~/.chef'), @zipfile.path)
    zf.write
  end
end
