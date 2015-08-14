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

  before_action :authenticate_user!

  before_action :set_infra

  before_action do
    def @infra.policy_class;MonitoringPolicy;end
    authorize(@infra)
  end

  before_action :with_zabbix, expect: [:show_cloudwatch_graph]
  before_action :set_zabbix, except: [:show_cloudwatch_graph]


  # GET /monitorings/:id
  def show
    # XXX: 一つでも登録されていたら監視をshowするようになってるけど、いい?
    if @infra.resources.ec2.none?{|r| @zabbix.host_exists?(r.physical_id)}
      # すべてのec2が登録されていなければ
      # Only show those hosts that are registered
      @before_register = true

      #get/load available zabbix templates set to static first.
      template_names = ['Template App FTP Service', false,
        'Template App HTTP Service', false,
        'Template App HTTPS Service', false,
        'Template App IMAP Service', false,
        'Template App LDAP Service', false,
        'Template App MySQL', false,
        'Template App NNTP Service', false,
        'Template App NTP Service', false,
        'Template App POP Service', false,
        'Template App SMTP Service', false,
        'Template App SSH Service', false,
        'Template App Telnet Service', false,
        'Template App Zabbix Agent', false,
        'Template App Zabbix Proxy', false,
        'Template App Zabbix Server', false,
        'Template OS Linux', false,
      ]
      new_array = []

      template_names.each_slice(2) do |value|
        new_array << {:name => value[0], :checked => value[1]}
      end

      @templates = new_array #@sky_zabbix.template.get(filter: {host: template_names})
      return
    end

    @monitor_selected_common   = @infra.master_monitorings.where(is_common: true)
    @monitor_selected_uncommon = @infra.master_monitorings.where(is_common: false)
    @resources = @infra.resources.ec2

  end

  # GET /monitorings/:id/show_cloudwatch_graph
  def show_cloudwatch_graph
    physical_id = params.require(:physical_id)

    cw = CloudWatch.new(@infra)
    # the average of data every 5 mins. 1 minute -> costs
    cloudwatch_stats = cw.get_networkinout(physical_id)

    render json: cloudwatch_stats
  end

  # GET /monitorings/show_zabbix_graph
  def show_zabbix_graph
    physical_id = params.require(:physical_id)
    item_key    = params.require(:item_key)

    # TODO: I18n
    unless @infra.resources.pluck(:physical_id).include?(physical_id)
      raise 'Invalid access!'
    end

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
    recent_problems = @zabbix.show_recent_problems(@infra)

    render json: recent_problems
  end

  # GET /monitorings/:id/show_url_status
  def show_url_status
    url_status = @zabbix.get_url_status_monitoring(@infra)

    render json: url_status
  end


  # GET /monitorings/:id/edit
  def edit
    z = @zabbix
    if @infra.resources.ec2.none?{|r| z.host_exists?(r.physical_id)}
      # XXX: workaround?
      render nothing: true, status: 400 and return
    end

    @master_monitorings = MasterMonitoring.all
    @selected_monitoring_ids = @infra.monitorings.pluck(:master_monitoring_id)

    hostname = @infra.resources.ec2.first.physical_id
    @trigger_expressions = z.get_trigger_expressions_by_hostname(hostname)
    @web_scenarios = z.all_web_scenarios(@infra)
  end

  # PUT /monitorings/:id
  def update
    web_scenario    = JSON.parse(params.require(:web_scenario))
    monitoring_ids  = params[:monitoring_ids]
    # hash -> {master_monitoring_id: expr num}
    expr_nums       = JSON.parse(params[:expressions])
    # hash -> {master_monitoring_id: rds_hostname}
    host_mysql      = JSON.parse(params[:host_mysql])
    # host_postgresql = JSON.parse(params[:host_postgresql])

    @infra.master_monitoring_ids = monitoring_ids
    master_monitorings = MasterMonitoring.all

    monitorings_selected = []
    trigger_exprs = {}
    master_monitorings.each do |monitoring|
      if @infra.master_monitorings.include?(monitoring)
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
    z.switch_trigger_status(@infra, monitorings_selected)
    z.create_web_scenario(@infra, web_scenario)
  end

  # POST /monitorings/:id/create_host
  def create_host
    resources = @infra.resources.ec2
    templates    = params.require(:templates)
    selected = []
    infra_logger_success(templates)
    templates.each do |k,v|
      puts "Mother key" + k
      value.each do |key,value|
        puts "key" + k
        puts "value" + v
      end
    end
    # z = @zabbix
    #
    # begin
    #   reqs = []
    #   resources.each do |resource|
    #     z.create_host(@infra, resource.physical_id)
    #
    #     # TODO: Batch request
    #     reqs.push z.templates_link_host(resource.physical_id, selected)
    #     item_info_cpu   = z.create_cpu_usage_item(resource.physical_id)
    #     item_info_mysql = z.create_mysql_login_item(resource.physical_id)
    #     reqs.push z.create_cpu_usage_trigger(  item_info_cpu,   resource.physical_id)
    #     reqs.push z.create_mysql_login_trigger(item_info_mysql, resource.physical_id)
    #   end
    #   reqs.push z.create_elb_host(@infra)
    #   z.batch(*reqs)
    # rescue => ex
    #   @infra.detach_zabbix()
    #
    #   render text: ex.message, status: 500 and return
    # end
    #
    # infra_logger_success("Infrastructure registerd to zabbix")
    # render nothing: true and return
  end


  private

  def set_infra
    @infra = Infrastructure.find(params.require(:id))
  end

  def set_zabbix
    @zabbix = Zabbix.new(current_user.email, current_user.encrypted_password)
  end
end
