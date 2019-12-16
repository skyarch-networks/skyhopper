#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# for Node model

class NodesController < ApplicationController
  include Concerns::InfraLogger

  # --------------- Auth
  before_action :authenticate_user!
  before_action :set_infra
  before_action :set_physical_id, only: %i[
    show get_security_groups submit_groups yum_update
    edit_ansible_playbook run_ansible_playbook update_ansible_playbook
    register_for_known_hosts
  ]

  # infra
  before_action do
    def @infra.policy_class
      NodePolicy
    end
    authorize(@infra)
    @locale = I18n.locale
  end

  before_action :check_register_in_knwon_hosts, only: %i[yum_update run_ansible_playbook]

  # GET /nodes/i-0b8e7f12
  def show
    instance          = @infra.instance(@physical_id)
    @instance_summary = instance.summary
    @platform = @instance_summary[:platform]

    @security_groups = @instance_summary[:security_groups]
    @snapshot_schedules = {}
    @instance_summary[:block_devices].each do |block_device|
      volume_id = block_device.ebs.volume_id
      @snapshot_schedules[volume_id] = SnapshotSchedule.essentials.find_or_create_by(volume_id: volume_id)
    end
    @retention_policies = @instance_summary[:retention_policies]

    @snapshots = Snapshot.describe(@infra, nil)

    @availability_zones = instance.availability_zones

    case @instance_summary[:status]
    when :terminated, :stopped
      return
    end

    resource = @infra.resource(@physical_id)

    @playbook_roles = resource.get_playbook_roles

    @info = {}
    status = resource.status
    @info[:ansible_status] = status.ansible.to_hash_for_api
    @info[:servertest_status] = status.servertest.to_hash_for_api
    @info[:update_status]     = status.yum.to_hash_for_api

    @dishes = Dish.valid_dishes(@infra.project_id)

    @number_of_security_updates = InfrastructureLog.number_of_security_updates(@infra.id, @physical_id)

    @yum_schedule = YumSchedule.essentials.find_or_create_by(physical_id: @physical_id)

    @selected_dish = resource.dish
  end

  # POST /nodes/i-0b8e7f12/apply_dish
  def apply_dish
    physical_id = params.require(:id)
    dish_id = params.require(:dish_id)

    dish = Dish.find(dish_id)

    playbook_roles = dish.playbook_roles_safe
    if playbook_roles.blank?
      render plain: I18n.t('nodes.msg.playbook_empty') and return
    end

    ret = update_playbook(
      physical_id: physical_id,
      infrastructure: @infra,
      playbook_roles: playbook_roles,
      extra_vars: dish.extra_vars_safe,
    )

    unless ret[:status]
      render plain: ret[:message], status: :internal_server_error and return
    end

    render plain: I18n.t('nodes.msg.dish_applied')
  end

  # POST /nodes/i-hogehoge/schedule_yum
  def schedule_yum
    physical_id = params.require(:physical_id)
    schedule    = params.require(:schedule).permit(:enabled, :frequency, :day_of_week, :time)

    ys = YumSchedule.find_by(physical_id: physical_id)
    ys.update!(schedule)

    if ys.enabled?
      PeriodicYumJob.set(
        wait_until: ys.next_run,
      ).perform_later(physical_id, @infra, current_user.id)
    end

    render plain: I18n.t('schedules.msg.yum_updated'), status: :ok and return
  end

  # GET /nodes/:id/get_rules
  def get_rules
    group_ids = params[:group_ids] || []

    rules_summary =
      if group_ids.empty?
        @infra.ec2.describe_security_groups
      else
        @infra.ec2.describe_security_groups({ group_ids: group_ids })
      end

    vpcs = @infra.ec2.describe_vpcs

    rules_summary[:security_groups].map do |item|
      check_socket(item.ip_permissions)
      check_socket(item.ip_permissions_egress)
    end

    sec_groups = File.read('public/security_groups.json')
    @rules_summary = rules_summary[:security_groups]
    @vpcs = vpcs[:vpcs]
    @sec_groups = JSON.parse(sec_groups)
  end

  # GET /nodes/:id/get_security_groups
  def get_security_groups
    av_g = @infra.ec2.describe_security_groups.to_h # Available groups
    instance = @infra.instance(@physical_id)
    ex = [] # existing groups array
    return_params = [] # filtered security groups
    instance.security_groups.each do |sec_group|
      ex.push(sec_group[:group_id])
    end

    av_g[:security_groups].each do |a_hash|
      if a_hash[:vpc_id] == instance.vpc.id
        a_hash[:checked] = ex.include? a_hash[:group_id]
        return_params.push(a_hash)
      end
    end

    @params = return_params
  end

  # POST /nodes/i-0b8e7f12/submit_groups
  def submit_groups
    group_ids = params.require(:group_ids)

    @infra.ec2.modify_instance_attribute({ instance_id: @physical_id, groups: group_ids })

    render plain: I18n.t('security_groups.msg.change_success')
  end

  # POST /nodes/i-0b8e7f12/create_groups
  # POST /nodes/create_group/:group_params
  def create_group
    group_params = params.require(:group_params)

    group_id = @infra.ec2.create_security_group({ group_name: group_params[0], description: group_params[1], vpc_id: group_params[3] })
    @infra.ec2.create_tags(resources: [group_id[:group_id]], tags: [{ key: 'Name', value: group_params[2] }])

    render plain: I18n.t('security_groups.msg.change_success')
  end

  def check_socket(field)
    field.map do |set|
      if set.from_port == -1 || set.from_port.nil? || set.from_port.zero?
        set.prefix_list_ids = 'All'
      elsif set.from_port == 5439
        set.prefix_list_ids = 'Redshift'
      else
        begin
          set.prefix_list_ids = Socket.getservbyport(set.from_port, set.ip_protocol)
        rescue StandardError
          set.prefix_list_ids = 'Unknown'
        end
      end
    end

    field
  end

  # PUT /nodes/:id/yum_update
  def yum_update
    security    = params.require(:security) == 'security'
    exec        = params.require(:exec) == 'exec'

    exec_yum_update(@infra, @physical_id, security, exec)
    render plain: I18n.t('nodes.msg.yum_update_started'), status: :accepted
  end

  # GET /nodes/:id/edit_ansible_playbook
  def edit_ansible_playbook
    resource = @infra.resource(@physical_id)

    @playbook_roles = resource.get_playbook_roles
    @roles = Ansible::get_roles(Node::ANSIBLE_WORKSPACE_PATH)
    @extra_vars = resource.get_extra_vars
  end

  # PUT /nodes/i-0b8e7f12/run_ansible_playbook
  def run_ansible_playbook
    Thread.new_with_db do
      run_ansible_playbook_node(@infra, @physical_id)
    end

    render plain: I18n.t('nodes.msg.playbook_applying'), status: :accepted
  end

  # PUT /nodes/:id/update_ansible_playbook
  def update_ansible_playbook
    playbook_roles = params[:playbook_roles] || []
    extra_vars = params[:extra_vars] || '{}'

    ret = update_playbook(physical_id: @physical_id, infrastructure: @infra, playbook_roles: playbook_roles, extra_vars: extra_vars)

    if ret[:status]
      render plain: I18n.t('nodes.msg.playbook_updated') and return
    end

    render plain: ret[:message], status: :internal_server_error and return
  end

  # PUT /nodes/:id/register_for_known_hosts
  def register_for_known_hosts
    ec2_instance = @infra.instance(@physical_id)

    ec2_instance.register_in_known_hosts

    render plain: I18n.t('nodes.msg.registered_in_known_hosts') and return
  end

  private

  def update_playbook(physical_id: nil, infrastructure: nil, playbook_roles: nil, extra_vars: nil)
    infra_logger_success("Updating playbook for #{physical_id} is started.")

    begin
      r = infrastructure.resource(physical_id)
      r.set_playbook_roles(playbook_roles)
      r.extra_vars = extra_vars
      r.save!
    rescue StandardError => ex
      infra_logger_fail("Updating playbook for #{physical_id} is failed. \n #{ex.message}")
      return { status: false, message: ex.message }
    end

    # change ansiblestatus to unexected
    r.status.ansible.un_executed!
    r.status.servertest.un_executed!

    infra_logger_success("Updating playbook for #{physical_id} is successfully updated.")
    { status: true, message: nil }
  end

  def run_ansible_playbook_node(infrastructure, physical_id)
    user_id = current_user.id
    infra_logger_success("Run ansible-playbook for #{physical_id} is started.", infrastructure_id: infrastructure.id, user_id: user_id)

    r = infrastructure.resource(physical_id)
    r.status.ansible.inprogress!
    r.status.servertest.un_executed!
    node = Node.new(physical_id)
    log = []

    ws = WSConnector.new('run-ansible-playbook', physical_id)

    begin
      node.run_ansible_playbook(infrastructure, r.get_playbook_roles, r.get_extra_vars) do |line|
        ws.push_as_json({ v: line })
        Rails.logger.debug "running-ansible-playbook #{physical_id} > #{line}"
        log << line
      end
    rescue StandardError => ex
      Rails.logger.debug(ex)
      r.status.ansible.failed!
      infra_logger_fail("Run ansible-playbook for #{physical_id} is failed.\nlog:\n#{log.join("\n")}", infrastructure_id: infrastructure.id, user_id: user_id)
      ws.push_as_json({ v: false })
      return
    end

    r.status.ansible.success!

    infra_logger_success("Run ansible-playbook for #{physical_id} is successfully finished.\nlog:\n#{log.join("\n")}", infrastructure_id: infrastructure.id, user_id: user_id)
    ws.push_as_json({ v: true })
  end

  # TODO: DRY
  def exec_yum_update(infra, physical_id, security = true, exec = false)
    Thread.new_with_db(infra, current_user.id) do |this_infra, user_id|
      yum_screen_name = 'yum '
      yum_screen_name << ' check' unless exec
      yum_screen_name << ' security' if security
      yum_screen_name << ' update'
      infra_logger_success("#{yum_screen_name} for #{physical_id} is started.", infrastructure_id: this_infra.id, user_id: user_id)

      r = this_infra.resource(physical_id)
      r.status.yum.inprogress!
      r.status.servertest.un_executed! if exec

      node = Node.new(physical_id)

      ws = WSConnector.new('cooks', physical_id)

      log = []

      begin
        node.yum_update(this_infra, security, exec) do |line|
          ws.push_as_json({ v: line })
          Rails.logger.debug "#{yum_screen_name} #{physical_id} > #{line}"
          log << line
        end
      rescue StandardError => ex
        Rails.logger.debug(ex)
        infra_logger_fail("#{yum_screen_name} for #{physical_id} is failed.\nlog:\n#{log.join("\n")}", infrastructure_id: this_infra.id, user_id: user_id)
        r.status.yum.failed!
        ws.push_as_json({ v: false })
      else
        infra_logger_success("#{yum_screen_name} for #{physical_id} is successfully finished.\nlog:\n#{log.join("\n")}", infrastructure_id: this_infra.id, user_id: user_id)
        r.status.yum.success!
        ws.push_as_json({ v: true })
      end
    end
  end

  def set_infra
    @infra = Infrastructure.find(params.require(:infra_id))
  end

  def set_physical_id
    @physical_id = params.require(:id)
  end

  def check_register_in_knwon_hosts
    physical_id = params.require(:id)
    resource = @infra.resource(physical_id)

    resource.should_be_registered_in_known_hosts(I18n.t('nodes.msg.not_register_in_known_hosts'))
  end
end
