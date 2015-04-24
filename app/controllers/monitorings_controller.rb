#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class MonitoringsController < ApplicationController
  # TODO: auth

  include Concerns::InfraLogger
  include Concerns::BeforeAuth

  before_action :authenticate_user!
  before_action only: [:edit, :update, :create_host] do
    infra = Infrastructure.find(params.require(:id))
    admin(infrastructure_path(project_id: infra.project.id))
  end
  before_action :with_zabbix_or_render, expect: [:show_cloudwatch_graph]
  before_action :set_zabbix, except: [:show_cloudwatch_graph]


  # GET /monitorings/:id
  def show
    infra = Infrastructure.find(params.require(:id))

    # XXX: 一つでも登録されていたら監視をshowするようになってるけど、いい?
    if infra.resources.ec2.none?{|r| @zabbix.host_exists?(r.physical_id)}
      # すべてのec2が登録されていなければ
      # Only show those hosts that are registered
      @before_register = true
      return
    end

    @monitor_selected_common   = infra.master_monitorings.where(is_common: true)
    @monitor_selected_uncommon = infra.master_monitorings.where(is_common: false)
    @resources = infra.resources.ec2
  end

  # GET /monitorings/:id/show_cloudwatch_graph
  def show_cloudwatch_graph
    infra = Infrastructure.find(params.require(:id))
    physical_id = params.require(:physical_id)

    cw = CloudWatch.new(infra)
    # the average of data every 5 mins. 1 minute -> costs
    cloudwatch_stats = cw.get_networkinout(physical_id)

    render json: cloudwatch_stats
  end

  # GET /monitorings/show_zabbix_graph
  def show_zabbix_graph
    physical_id = params.require(:physical_id)
    item_key    = params.require(:item_key)

    z = @zabbix

    if item_key == "mysql.login"
      item_infos = z.get_item_info(physical_id, item_key, 'search')
      item_key = item_infos.first["key_"]
    end

    history_all = z.get_history(physical_id, item_key)

    render json: history_all
  end

  # GET /monitorings/:id/show_problems
  def show_problems
    infra = Infrastructure.find(params.require(:id))
    recent_problems = @zabbix.show_recent_problems(infra)

    render json: recent_problems
  end

  # GET /monitorings/:id/show_url_status
  def show_url_status
    infra = Infrastructure.find(params.require(:id))
    url_status = @zabbix.get_url_status_monitoring(infra)

    render json: url_status
  end


  # GET /monitorings/:id/edit
  def edit
    z = @zabbix
    infra = Infrastructure.find(params.require(:id))

    if infra.resources.ec2.none?{|r| z.host_exists?(r.physical_id)}
      # XXX: workaround?
      render nothing: true, status: 400 and return
    end

    @master_monitorings = MasterMonitoring.all
    @selected_monitoring_ids = infra.monitorings.pluck(:master_monitoring_id)

    hostname = infra.resources.ec2.first.physical_id
    @trigger_expressions = z.get_trigger_expressions_by_hostname(hostname)
    @web_scenarios = z.all_web_scenarios(infra)
  end

  # PUT /monitorings/:id
  def update
    infra           = Infrastructure.find(params.require(:id))
    web_scenario    = JSON.parse(params.require(:web_scenario))
    monitoring_ids  = params[:monitoring_ids]
    # hash -> {master_monitoring_id: expr num}
    expr_nums       = JSON.parse(params[:expressions])
    # hash -> {master_monitoring_id: rds_hostname}
    host_mysql      = JSON.parse(params[:host_mysql])
    host_postgresql = JSON.parse(params[:host_postgresql])

    infra.master_monitoring_ids = monitoring_ids
    master_monitorings = MasterMonitoring.all

    monitorings_selected = []
    trigger_exprs = {}
    master_monitorings.each do |monitoring|
      if infra.master_monitorings.include?(monitoring)
        monitorings_selected.push(monitoring.item)
      end

      # ハッシュのキーを置換えて新しく作成しなおしている
      # {master_monitoring_id: expr_num(数字だけ)} -> {item_key: expressions(式)}
      expr_nums.each do |k, v|
        if k.to_i == monitoring.id
          new_k = monitoring.item
          new_v = monitoring.trigger_expression + v.to_s
          trigger_exprs[new_k] = new_v
          break
        end
      end
    end

    z = @zabbix

    #TODO infra.eachをここでまとめる
    z.switch_trigger_status(infra, monitorings_selected)
    z.create_web_scenario(infra, web_scenario)

    # zabbix側でmysqlに関するitemとtrigger expressionをアップデートする
    z.update_mysql(infra, host_mysql["host"])

    # if there are any triggers to update then do so
    if expr_nums.present?
      z.update_trigger_expression(infra, trigger_exprs)
    end

    infra_logger_success("Monitoring Options updated")

    # TODO: Zabbix Server側の状態の更新
    # TODO: I18n
    render text: I18n.t('monitoring.msg.updated')
  end

  # POST /monitorings/:id/create_host
  def create_host
    infra = Infrastructure.find(params.require(:id))
    resources = infra.resources.ec2

    z = @zabbix

    begin
      resources.each do |resource|
        z.create_host(infra, resource.physical_id)

        #TODO put these templates in array and update in once
        z.templates_link_host(resource.physical_id, ['Template OS Linux', 'Template App HTTP Service', 'Template App SMTP Service'])
        item_info_cpu = z.create_cpu_usage_item(resource.physical_id)
        z.create_cpu_usage_trigger(item_info_cpu, resource.physical_id)
        item_info_mysql = z.create_mysql_login_item(resource.physical_id)
        z.create_mysql_login_trigger(item_info_mysql, resource.physical_id)
      end
      z.create_elb_host(infra)
    rescue => ex
      infra.detach_zabbix()

      render text: ex.message, status: 500 and return
    end

    infra_logger_success("Infrastructure registerd to zabbix")
    render nothing: true and return
  end


  private

  def set_zabbix
    begin
      @zabbix = Zabbix.new(current_user.email, current_user.encrypted_password)
    rescue Zabbix::ConnectError => ex
      #flash[:alert] = "Zabbix 処理中にエラーが発生しました #{ex.message}"
    end
  end
end
