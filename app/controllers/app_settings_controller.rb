#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
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

    ec2key = Ec2PrivateKey.create!(
      name:  keypair_name,
      value: keypair_value,
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
      ChefServer
      ChefServer::Deployment

      set = AppSetting.get
      stack_name = "SkyHopperZabbixServer-#{Digest::MD5.hexdigest(DateTime.now.to_s)}"

      ChefServer::Deployment.create_zabbix(stack_name, set.aws_region, set.ec2_private_key.name, set.ec2_private_key.value)
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
    stack_name = "SkyHopperChefServer-#{Digest::MD5.hexdigest(DateTime.now.to_s)}"

    set = AppSetting.first
    region        = set.aws_region
    keypair_name  = set.ec2_private_key.name
    keypair_value = set.ec2_private_key.value

    # おまじない
    ChefServer
    ChefServer::Deployment

    Thread.new_with_db do
      ws = WSConnector.new('chef_server_deployment', 'status')

      begin
        ChefServer::Deployment.create(stack_name, region, keypair_name, keypair_value) do |data, msg|
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

  private

  # statusに対応するメッセージをJSONとして返す
  # {
  #   percentage: 0..100 (Int) or null(when error),
  #   status:     'in_progress' or 'complete' or 'error' (String),
  #   message:    I18ned String
  # }
  def build_ws_message(status, msg = nil)
    hash = ChefServer::Deployment::Progress[status].dup
    hash[:message] = msg || I18n.t("chef_servers.msg.#{status}")
    return JSON.generate(hash)
  end
end
