#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# for Node model and Chef

class NodesController < ApplicationController
  include Concerns::InfraLogger


  # --------------- Auth
  before_action :authenticate_user!
  before_action :set_infra, except: [:recipes]

  # infra
  before_action except: [:recipes] do
    def @infra.policy_class; NodePolicy;end
    authorize(@infra)
  end



  # GET /nodes/:id/run_bootstrap
  # @param [String] id physical_id of EC2 instance.
  # @param [String] infra_id Infrastructure id.
  def run_bootstrap
    Thread.new_with_db do
      physical_id = params.require(:id)
      fqdn        = @infra.instance(physical_id).fqdn

      infra_logger_success("Bootstrapping for #{physical_id} is started.")

      ws = WSConnector.new('bootstrap', physical_id)

      begin
        Node.bootstrap(fqdn, physical_id, @infra)
      rescue => ex
        logger.error ex
        infra_logger_fail("Bootstrapping for #{physical_id} is failed. \n #{ex.message}")
        ws.push_as_json({message: ex.message, status: false})
      else
        infra_logger_success("Bootstrapping for #{physical_id} is successfully finished.")
        ws.push_as_json({message: I18n.t('nodes.msg.bootstrap_finish', physical_id: physical_id), status: true})
      end
    end

    render nothing: true, status: 200 and return
  end

  # GET /nodes/i-0b8e7f12
  def show
    # TODO: before_action
    physical_id = params.require(:id)

    instance          = @infra.instance(physical_id)
    @instance_summary = instance.summary

    case @instance_summary[:status]
    when :terminated, :stopped
      return
    end

    chef_server = ServerState.new('chef')

    if @chef_error = !chef_server.is_running?
      @chef_msg = t 'chef_servers.msg.not_running'
      return
    end

    resource = @infra.resource(physical_id)
    n = Node.new(physical_id)
    begin
      @runlist       = n.details["run_list"]
      @selected_dish = resource.dish
    rescue ChefAPI::Error::NotFound
      # in many cases, before bootstrap
      @before_bootstrap = true
      return
    rescue ChefAPI::Error => ex
      @chef_error = true
      @chef_msg = ex.message
      return
    end

    @info = {}
    status = resource.status
    @info[:cook_status]       = status.cook
    @info[:serverspec_status] = status.serverspec
    @info[:update_status]     = status.yum

    @dishes = Dish.valid_dishes(@infra.project_id)

    @number_of_security_updates = InfrastructureLog.number_of_security_updates(@infra.id, physical_id)

    @yum_schedule = YumSchedule.find_or_create_by(physical_id: physical_id)

    @attribute_set = n.attribute_set?
  end

  # GET /nodes/i-0b8e7f12/edit
  def edit
    physical_id = params.require(:id)
    details = Node.new(physical_id).details
    @runlist = details["run_list"]

    @roles     = ChefAPI.index(:role).map(&:name).sort
    @cookbooks = ChefAPI.index(:cookbook).keys.sort
  end

  # GET /nodes/recipes/:cookbook
  def recipes
    cookbook_name = params.require(:cookbook)
    @recipes = ChefAPI.recipes(cookbook_name).sort
    render json: @recipes
  end

  # PUT /nodes/i-0b8e7f12
  def update
    physical_id = params.require(:id)
    runlist     = params[:runlist] || []


    ret = update_runlist(physical_id: physical_id, infrastructure: @infra, runlist: runlist)

    if ret[:status]
      render text: I18n.t('nodes.msg.runlist_updated') and return
    end

    render text: ret[:message], status: 500 and return
  end

  # PUT /nodes/i-0b8e7f12/cook
  def cook
    physical_id = params.require(:id)

    node = Node.new(physical_id)

    unless node.attribute_set?
      render text: I18n.t('nodes.msg.should_set_attr'), status: 400
      return
    end

    Thread.new_with_db do
      cook_node(@infra, physical_id)
    end

    render text: I18n.t('nodes.msg.runlist_applying'), status: 202
  end

  # POST /nodes/i-0b8e7f12/apply_dish
  def apply_dish
    physical_id = params.require(:id)
    dish_id     = params.require(:dish_id)

    dish           = Dish.find(dish_id)

    runlist = dish.runlist
    if runlist.blank?
      render text: I18n.t('nodes.msg.runlist_empty') and return
    end

    ret = update_runlist(physical_id: physical_id, infrastructure: @infra, runlist: runlist, dish_id: dish_id)

    unless ret[:status]
      render text: ret[:message], status: 500 and return
    end

    render text: I18n.t('nodes.msg.dish_applied')
  end


  # ==== Route
  # PUT /nodes/i-hogehoge/update_attributes
  # ==== params
  # [id] physical_id
  # [attributes] JSON string
  # [infra_id] 認証に必要
  def update_attributes
    physical_id = params.require(:id)
    attr  = JSON.parse(params.require(:attributes))

    node = Node.new(physical_id)

    parsed_attr = node.attr_slash_to_hash(attr)

    begin
      node.update_attributes(parsed_attr)
    rescue => e
      render text: e.message, status: 500 and return
    end

    Resource.find_by(physical_id: physical_id).status.cook.un_executed!
    render text: I18n.t('nodes.msg.attribute_updated') and return
  end

  # POST /nodes/i-hogehoge/schedule_yum
  def schedule_yum
    physical_id = params.require(:physical_id)
    schedule    = params.require(:schedule).permit(:enabled, :frequency, :day_of_week, :time)

    ys = YumSchedule.find_by(physical_id: physical_id)
    ys.update_attributes!(schedule)

    if ys.enabled?
      PeriodicYumJob.set(
        wait_until: ys.next_run
      ).perform_later(physical_id, @infra, current_user.id)
    end

    render text: I18n.t('schedules.msg.yum_updated'), status: 200 and return
  end

  # ==== Route
  # GET /nodes/:id/edit_attributes
  # ==== params
  # [id] physical_id
  # [infra_id] 認証に必要
  def edit_attributes
    physical_id = params.require(:id)

    node = Node.new(physical_id)

    @attrs = node.enabled_attributes.dup
    @current_attributes = node.get_attributes
  end

  # PUT /nodes/:id/yum_update
  def yum_update
    physical_id = params.require(:id)
    security    = params.require(:security) == "security"
    exec        = params.require(:exec) == "exec"

    exec_yum_update(@infra, physical_id, security, exec)
    render text: I18n.t('nodes.msg.yum_update_started'), status: 202
  end


  private

  # @param [String] physical_id physical_id of EC2 instance.
  # @param [Infrastructure] infrastructure
  # @param [Array<String>] runlist Array of cookbook/recipe
  # @param [String] dish_id Dish id.
  # @return [Hash] status and message. If update fail, status is false and message is error message.
  def update_runlist(physical_id: nil, infrastructure: nil, runlist: nil, dish_id: nil)
    node = Node.new(physical_id)
    infra_logger_update_runlist(node)

    begin
      node.update_runlist(runlist)
      r = infrastructure.resource(physical_id)
      r.dish_id = dish_id
      r.save!
    rescue => ex
      infra_logger_fail("Updating runlist for #{physical_id} is failed. \n #{ex.message}")
      return {status: false, message: ex.message}
    end

    # change cookstatus to unexected
    r.status.cook.un_executed!
    r.status.serverspec.un_executed!

    infra_logger_success("Updating runlist for #{physical_id} is successfully updated.")
    return {status: true, message: nil}
  end


  # TODO: refactor
  def cook_node(infrastructure, physical_id)
    user_id = current_user.id
    infra_logger_success("Cook for #{physical_id} is started.", infrastructure_id: infrastructure.id, user_id: user_id)

    r = infrastructure.resource(physical_id)
    r.status.cook.inprogress!
    r.status.serverspec.un_executed!
    node = Node.new(physical_id)
    node.wait_search_index
    log = []

    ws = WSConnector.new('cooks', physical_id)

    begin
      node.cook(infrastructure) do |line|
        ws.push_as_json({v: line})
        Rails.logger.debug "cooking #{physical_id} > #{line}"
        log << line
      end
    rescue => ex
      Rails.logger.debug(ex)
      r.status.cook.failed!
      infra_logger_fail("Cook for #{physical_id} is failed.\nlog:\n#{log.join("\n")}", infrastructure_id: infrastructure.id, user_id: user_id)
      ws.push_as_json({v: false})
      return
    end

    r.status.cook.success!
    infra_logger_success("Cook for #{physical_id} is successfully finished.\nlog:\n#{log.join("\n")}", infrastructure_id: infrastructure.id, user_id: user_id)
    ws.push_as_json({v: true})

    if r.dish_id # if resource has dish
      ServerspecJob.perform_now(physical_id, @infra.id, current_user.id)
    end
  end

  # TODO: DRY
  def exec_yum_update(infra, physical_id, security=true, exec=false)
    Thread.new_with_db(infra, physical_id, current_user.id) do |infra, physical_id, user_id|
      yum_screen_name = "yum "
      yum_screen_name << " check" unless exec
      yum_screen_name << " security" if security
      yum_screen_name << " update"
      infra_logger_success("#{yum_screen_name} for #{physical_id} is started.", infrastructure_id: infra.id, user_id: user_id)

      r = infra.resource(physical_id)
      r.status.yum.inprogress!
      r.status.serverspec.un_executed! if exec

      node = Node.new(physical_id)

      ws = WSConnector.new('cooks', physical_id)

      log = []

      begin
        node.yum_update(infra, security, exec) do |line|
          ws.push_as_json({v: line})
          Rails.logger.debug "#{yum_screen_name} #{physical_id} > #{line}"
          log << line
        end
      rescue => ex
        Rails.logger.debug(ex)
        infra_logger_fail("#{yum_screen_name} for #{physical_id} is failed.\nlog:\n#{log.join("\n")}", infrastructure_id: infra.id, user_id: user_id)
        r.status.yum.failed!
        ws.push_as_json({v: false})
      else
        infra_logger_success("#{yum_screen_name} for #{physical_id} is successfully finished.\nlog:\n#{log.join("\n")}", infrastructure_id: infra.id, user_id: user_id)
        r.status.yum.success!
        ws.push_as_json({v: true})
      end
    end
  end

  def set_infra
    @infra = Infrastructure.find(params.require(:infra_id))
  end
end
