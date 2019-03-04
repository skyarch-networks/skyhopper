#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class AppSettingsController < ApplicationController
  before_action :authenticate_user!, except: [:show, :create, :system_server_create]

  before_action except: [:edit_zabbix, :update_zabbix] do
    if AppSetting.set?
      redirect_to root_path
    end
  end


  class SystemServerError < ::StandardError; end

  CF_PARAMS_KEY = 'cf_params'.freeze
  CREATE_OPTIONS_KEY = 'create_options'.freeze


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
    skip_zabbix_server = settings.delete(:skip_zabbix_server)

    set_ec2(settings[:aws_region], access_key, secret_access_key)

    cf_params = {}

    if vpc_id
      verify_vpc_id!(vpc_id)
      cf_params[:VpcId] = vpc_id
    end

    if subnet_id
      verify_subnet_id!(subnet_id)
      cf_params[:SubnetId] = subnet_id
    end

    check_eip_limit!(skip_zabbix_server)

    Rails.cache.write(CF_PARAMS_KEY, cf_params)
    Rails.cache.write(CREATE_OPTIONS_KEY, {
      skip_zabbix_server: skip_zabbix_server
    })

    ec2key = Ec2PrivateKey.create!(
      name:  keypair_name,
      value: keypair_value
    )

    settings[:ec2_private_key_id] = ec2key.id

    AppSetting.clear_dummy
    app_setting = AppSetting.new(settings)
    app_setting.dummy = true
    app_setting.save!
    AppSetting.clear_cache


    begin
      projects = Project.for_system
    rescue
      raise SystemServerError, I18n.t('app_settings.msg.db_seed_not_found', server: 'System')
    end

    projects.each do |project|
      project.update!(access_key: access_key, secret_access_key: secret_access_key)
    end

    render text: I18n.t('app_settings.msg.created') and return
  end

  # GET /app_settings/edit_zabbix
  def edit_zabbix
    @app_setting = AppSetting.get
    render 'zabbix_server'
  end

  # [Commendted] for Zabbix Server update
  # def update_zabbix
  #   app_setting = AppSetting.get
  #   user = params.require(:zabbix_user)
  #   pass = params.require(:zabbix_pass)
  #
  #   app_setting.update!(zabbix_user: user, zabbix_pass: pass)
  #   AppSetting.clear_cache
  #
  #   redirect_to clients_path, notice: I18n.t('app_settings.msg.zabbix_updated')
  # end


  # POST /app_settings/system_server_create
  def system_server_create
    set = AppSetting.first
    region        = set.aws_region
    keypair_name  = set.ec2_private_key.name
    keypair_value = set.ec2_private_key.value

    @locale = I18n.locale

    cf_params = Rails.cache.fetch(CF_PARAMS_KEY)
    raise 'Failure to acquire cf_params' if cf_params.nil?
    Rails.cache.delete(CF_PARAMS_KEY)

    create_options = Rails.cache.fetch(CREATE_OPTIONS_KEY)
    raise 'Failure to acquire create_options' if create_options.nil?
    Rails.cache.delete(CREATE_OPTIONS_KEY)

    # おまじない
    # rubocop:disable Lint/Void
    SystemServer
    SystemServer::Deployment
    CfTemplate
    Client
    Infrastructure
    Project
    ProjectParameter
    Stack
    ZabbixServer
    # rubocop:enable Lint/Void

    Thread.new_with_db do
      ws = WSConnector.new('chef_server_deployment', 'status')

      begin
        unless create_options[:skip_zabbix_server]
          # ZabbixServerの構築
          stack_name = "SkyHopperZabbixServer-#{Digest::MD5.hexdigest(DateTime.now.in_time_zone.to_s)}"
          SystemServer::Deployment.create_zabbix(stack_name, region, keypair_name, keypair_value, cf_params)
        else
          sleep(1) # ZabbixServerの構築がスキップされた場合、少し待たないとWebSocket通信が失敗する
        end

        set.dummy = false
        set.save!
        AppSetting.clear_cache

        ws.push(build_ws_message(:complete))
      rescue => ex
        Rails.logger.error(ex.message)
        Rails.logger.error(ex.backtrace)
        ws.push(build_ws_message(:error, ex.message))
      end
    end

    render text: build_ws_message(:creating_zabbix_server)
  end

  private

  # statusに対応するメッセージをJSONとして返す
  # {
  #   percentage: 0..100 (Int) or null(when error),
  #   status:     'in_progress' or 'complete' or 'error' (String),
  #   message:    I18ned String
  # }
  def build_ws_message(status, msg = nil)
    hash = SystemServer::Deployment::Progress[status].dup
    I18n.locale = @locale
    hash[:message] = msg || I18n.t("system_servers.msg.#{status}")
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
  def check_eip_limit!(skip_zabbix_server)
    return if skip_zabbix_server
    a = @ec2.describe_account_attributes
    limit = a.account_attributes.find{|x| x.attribute_name == 'vpc-max-elastic-ips'}.attribute_values.first.attribute_value.to_i
    n = @ec2.describe_addresses.addresses.size
    if limit - n < 1 # ZabbixServer1個分
      raise EIPLimitError, I18n.t('app_settings.msg.eip_limit_error')
    end
  end

  def verify_vpc_id!(vpc_id)
    @ec2.describe_vpcs(vpc_ids: [vpc_id])
  end

  def verify_subnet_id!(subnet_id)
    @ec2.describe_subnets(subnet_ids: [subnet_id])
  end

end
