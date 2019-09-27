#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class InfrastructuresController < ApplicationController
  include Concerns::InfraLogger

  # --------------- Auth
  before_action :authenticate_user!

  # --------------- existence check
  before_action :project_exist, only: [:index]
  before_action :infrastructure_exist, only: %i[edit update destroy delete_stack stack_events edit_keypair update_keypair]

  before_action :set_infrastructure, only: %i[edit update destroy delete_stack stack_events show_rds show_elb start_rds stop_rds reboot_rds edit_keypair update_keypair]

  before_action do
    infra = @infrastructure || (
      project_id = begin
                     params[:project_id] || params[:infrastructure][:project_id]
                   rescue StandardError
                     nil
                   end
      Infrastructure.new(project_id: project_id)
    )

    authorize(infra)
  end

  before_action :with_zabbix, only: %i[destroy delete_stack]

  @@regions = AWS::Regions

  # GET /infrastructures
  # GET /infrastructures.json
  def index
    project_id = params.require(:project_id)
    session[:project_id] = project_id
    page = params[:page] || 1

    @selected_project = Project.find(project_id)

    @infrastructures = @selected_project.infrastructures.includes(:ec2_private_key).page(page)
    @selected_client = @selected_project.client

    respond_to do |format|
      format.json
      format.html
    end
  end

  # GET /infrastructures/:id
  def show
    raise "Infrastructure \##{params[:id]} does not exist" unless Infrastructure.exists?(id: params[:id])

    set_infrastructure

    stack = Stack.new(@infrastructure)

    resp = {
      status: stack.status_and_type,
      name: @infrastructure.stack_name,
      token_invalid: stack.status[:message].eql?('The security token included in the request is invalid.'),
    }

    # When stack does not exist
    unless stack.status[:available] # in many cases, it will be when stack does not exist.
      @infrastructure.status = ''
      @infrastructure.save!
      @infrastructure.resources.destroy_all

      resp[:message] = stack.status[:message]
    end

    if stack.update_complete? && @infrastructure.resources_updated?
      @infrastructure.resources.destroy_all
    end

    @infrastructure.status = stack.status[:status]
    @infrastructure.save!

    render json: resp and return
  end

  # GET /infrastructures/:id/stack_events
  def stack_events
    stack = Stack.new(@infrastructure)
    events = nil
    begin
      events = stack.events
      # rubocop:disable Lint/HandleExceptions
    rescue Aws::CloudFormation::Errors::ValidationError # stack does not exist
      # rubocop:enable Lint/HandleExceptions
    end

    render json: {
      stack_status: stack.status_and_type,
      stack_events: events,
    } and return
  end

  # GET /infrastructures/new
  def new
    project_id = params.require(:project_id)
    @infrastructure = Infrastructure.new(
      project_id: project_id,
    )
    @regions = @@regions
    set_ec2_private_key_list(Project.find(project_id))
  end

  # GET /infrastructures/1/edit
  # スタック情報が取得できない場合のみ
  def edit
    if @infrastructure.status.present?
      redirect_to infrastructures_path(project_id: @infrastructure.project_id),
                  alert: I18n.t('infrastructures.msg.not_necessary')
    end

    @regions = @@regions
  end

  # POST /infrastructures
  # POST /infrastructures.json
  def create
    current_params = insert_selected_ec2_private_key(infrastructure_params)

    # raise error if uploaded keypair does not exist
    KeyPair.validate!(
      current_params[:project_id],
      current_params[:region],
      current_params[:keypair_name],
      current_params[:keypair_value],
    )

    infra = Infrastructure.create_with_ec2_private_key!(current_params)
  rescue StandardError => ex
    flash[:alert] = ex.message
    @regions = @@regions
    project = Project.find(params[:infrastructure][:project_id])
    set_ec2_private_key_list(project)
    @infrastructure = Infrastructure.new(infrastructure_params(no_keypair: true))

    render action: 'new', status: :bad_request and return
  else
    redirect_to infrastructures_path(project_id: infra.project_id),
                notice: I18n.t('infrastructures.msg.created')
  end

  # PATCH/PUT /infrastructures/1
  # PATCH/PUT /infrastructures/1.json
  def update
    begin
      @infrastructure.update!(infrastructure_params)
    rescue StandardError => ex
      @regions = @@regions
      flash[:alert] = ex.message
      render action: :edit, status: :bad_request and return
    end

    redirect_to infrastructures_path(project_id: @infrastructure.project_id),
                notice: I18n.t('infrastructures.msg.updated')
  end

  # DELETE /infrastructures/1
  # DELETE /infrastructures/1.json
  ## detach
  def destroy
    @infrastructure.destroy!

    render plain: I18n.t('infrastructures.msg.detached')
  end

  # POST /infrastructures/1/delete_stack
  def delete_stack
    @infrastructure.detach_zabbix

    begin
      stack = Stack.new(@infrastructure)
      stack.delete # it returns nil without exception if there is no stack in the region
    rescue StandardError => ex
      logger.error "#{ex.class}: #{ex.message.inspect}"
      logger.error ex.backtrace.join("\n")
      @infrastructure.status = stack.status[:status]
      @infrastructure.save!
      infra_logger_fail("Deleting stack is failed. \n #{ex.class}: #{ex.message.inspect} \n" + ex.backtrace.join("\n"))

      raise ex
    end

    infra_logger_success('Deleting stack is successfully started.')

    @infrastructure.resources.destroy_all
    @infrastructure.monitorings.delete_all

    render plain: I18n.t('infrastructures.msg.delete_stack_started'), status: :accepted and return
  end

  # GET /infrastructures/:id/show_rds
  def show_rds
    physical_id = params.require(:physical_id)
    sc_g = @infrastructure.ec2.describe_security_groups.to_h
    rds = RDS.new(@infrastructure, physical_id)
    security_groups = map_security_groups(sc_g, rds.security_groups)

    @rds             = rds
    @security_groups = security_groups
  end

  # GET /infrastructures/:id/show_elb
  def show_elb
    physical_id = params.require(:physical_id)

    elb = ELB.new(@infrastructure, physical_id)

    sc_g = @infrastructure.ec2.describe_security_groups.to_h
    security_groups = map_security_groups(sc_g, elb.security_groups)

    @ec2_instances = elb.instances
    @dns_name      = elb.dns_name
    @listeners     = elb.listeners

    @security_groups = security_groups

    ec2 = @infrastructure.resources.ec2
    @unregistereds = ec2.reject { |e| @ec2_instances.map { |x| x[:instance_id] }.include?(e.physical_id) }

    list_server_certificates = elb.list_server_certificates

    @server_certificate_name_items = list_server_certificates[0].reject(&:nil?).map do |crt|
      {
        text: crt['server_certificate_name'],
        value: crt['arn'],
      }
    end

    @server_certificates = list_server_certificates[0].reject(&:nil?).map do |crt|
      {
        name: crt['server_certificate_name'],
        expiration: crt['expiration'],
      }
    end
  end

  # POST /infrastructures/change_rds_scale
  def change_rds_scale
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:id)
    type        = params.require(:instance_type)

    rds = Infrastructure.find(infra_id).rds(physical_id)

    begin
      result = rds.change_scale(type)
    rescue RDS::ChangeScaleError => ex
      render plain: ex.message, status: :bad_request and return
    end

    render json: { rds: result.db_instance } and return
  end

  # POST /infreastructures/rds_submit_groups
  def rds_submit_groups
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:id)
    group_ids   = params.require(:group_ids)

    rds = Infrastructure.find(infra_id).rds(physical_id)
    rds.modify_security_groups(group_ids)

    infra_logger_success("#{physical_id} security groups has been modified.")

    render plain: I18n.t('security_groups.msg.change_success')
  end

  def show_s3
    @bucket_name = params.require(:bucket_name)
    infra_id     = params.require(:id)

    infrastructure = Infrastructure.find(infra_id)
    @s3 = S3.new(infrastructure, @bucket_name)

    render partial: 'show_s3'
  end

  # GET /infreastructures/get_schedule
  # @param [Integer] infra_id
  # @param [String]  physical_id
  def get_schedule
    infra_id = params.require(:infra_id)
    physical_id = params.require(:physical_id)
    resource = Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id)

    @operation_schedule = resource.operation_durations.order('created_at desc')

    respond_to do |format|
      format.json do
        render json: @operation_schedule.as_json(only: %i[id start_date end_date],
                                                 include: [{ recurring_date: { only: %i[id repeats start_time end_time dates] } },
                                                           { resource: { only: [:physical_id] } },],)
      end
    end
  end

  # POST /infrastructures/save_schedule
  # @param [Integer] infra_id
  # @param [String] physical_id
  # @param [Object] selected_instance
  def save_schedule
    selected_instance = params.require(:selected_instance)
    ops_exists = OperationDuration.find_by(resource_id: selected_instance[:id])
    start_date = Time.at(selected_instance[:start_date].to_i).in_time_zone
    end_date = Time.at(selected_instance[:end_date].to_i).in_time_zone

    if ops_exists
      ops_exists.start_date = start_date
      ops_exists.end_date = end_date
      ops_exists.save

      recur_exits = RecurringDate.find_by(operation_duration_id: ops_exists.id)
      recur_exits.repeats = selected_instance[:repeat_freq].to_i
      recur_exits.start_time = start_date.strftime('%H:%M')
      recur_exits.end_time = end_date.strftime('%H:%M')
      recur_exits.dates = selected_instance[:dates]
      recur_exits.save
    else
      begin
        ops = OperationDuration.create!(
          resource_id: selected_instance[:id],
          start_date: start_date,
          end_date: end_date,
          user_id: current_user.id,
        )
        RecurringDate.create!(
          operation_duration_id: ops.id,
          repeats: selected_instance[:repeat_freq].to_i,
          start_time: start_date.strftime('%H:%M'),
          end_time: end_date.strftime('%H:%M'),
          dates: selected_instance[:dates],
        )
      rescue StandardError => ex
        render plain: ex.message, status: :internal_server_error and return
      end
    end

    render plain: I18n.t('operation_scheduler.msg.saved'), status: :ok and return
  end

  # GET /infrastructures/1/edit_keypair
  def edit_keypair
    set_ec2_private_key_list(@infrastructure.project)
  end

  # PATCH /infrastructures/1/update_keypair
  def update_keypair
    keypair_params = insert_selected_ec2_private_key(
      params.require(:infrastructure).permit(:keypair_name, :keypair_value),
    )

    # raise error if uploaded keypair does not exist
    KeyPair.validate!(
      @infrastructure.project_id,
      @infrastructure.region,
      keypair_params[:keypair_name],
      keypair_params[:keypair_value],
    )

    @infrastructure.update_with_ec2_private_key!(keypair_params)
  rescue StandardError => ex
    flash[:alert] = ex.message
    set_ec2_private_key_list(@infrastructure.project)
    render action: :edit_keypair, status: :bad_request and return
  else
    redirect_to infrastructures_path(project_id: @infrastructure.project_id), notice: I18n.t('infrastructures.msg.updated')
  end

  def start_rds
    physical_id = params.require(:physical_id)
    rds = @infrastructure.rds(physical_id)
    result = rds.start_db_instance

    @db_instance = result.db_instance
    @message     = t('infrastructures.msg.start_rds')
  end

  def stop_rds
    physical_id = params.require(:physical_id)
    rds = @infrastructure.rds(physical_id)
    result = rds.stop_db_instance

    @db_instance = result.db_instance
    @message     = t('infrastructures.msg.stop_rds')
  end

  def reboot_rds
    physical_id = params.require(:physical_id)
    rds = @infrastructure.rds(physical_id)
    result = rds.reboot_db_instance

    @db_instance = result.db_instance
    @message     = t('infrastructures.msg.reboot_rds')
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_infrastructure
    @infrastructure = Infrastructure.find(params.require(:id))
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def infrastructure_params(no_keypair: nil)
    p = params.require(:infrastructure).permit(:project_id, :stack_name, :keypair_name, :keypair_value, :region)

    if no_keypair
      p.delete(:keypair_name)
      p.delete(:keypair_value)
    end
    p
  end

  # mapping of security groups by resource
  def map_security_groups(sc_g, resource)
    security_groups = []
    sc_g[:security_groups].each do |a_hash|
      a_hash[:checked] = resource.include? a_hash[:group_id]
      security_groups.push(a_hash)
    end
    security_groups
  end

  # redirect to projects#index if specified project does not exist
  def project_exist
    return if params[:project_id].blank?
    return if Project.exists?(id: params[:project_id])

    path =
      if current_user.master?
        if session[:client_id].present?
          projects_path(client_id: session[:client_id])
        else
          clients_path
        end
      else
        projects_path
      end

    redirect_to path, alert: "Project \##{params[:project_id]} does not exist."
  end

  # redirect to projects#index if specified project does not exist
  def infrastructure_exist
    return if params[:id].blank?
    return if Infrastructure.exists?(id: params[:id])

    msg = "Infrastructure \##{params[:id]} does not exist."
    path =
      if session[:project_id].present?
        infrastructures_path(project_id: session[:project_id])
      elsif current_user.master?
        clients_path
      else
        projects_path
      end

    redirect_to path, alert: msg
  end

  def set_ec2_private_key_list(project)
    @ec2_private_key_list = project.infrastructures.map do |infrastructure|
      [
        "#{infrastructure.stack_name}(#{infrastructure.ec2_private_key.name})",
        infrastructure.ec2_private_key.id,
      ]
    end
  end

  def insert_selected_ec2_private_key(target_params)
    if params[:infrastructure][:keypair_input_type] == 'select'
      project = @infrastructure.present? ? @infrastructure.project : Project.find(params[:infrastructure][:project_id])
      unless project.infrastructures.pluck(:ec2_private_key_id).include?(params[:infrastructure][:copy_ec2_private_key_id].to_i)
        raise 'Parameter copy_ec2_private_key_id is invalid.'
      end

      ec2_private_key = Ec2PrivateKey.find(params[:infrastructure][:copy_ec2_private_key_id])
      target_params[:keypair_name] = ec2_private_key.name
      target_params[:keypair_value] = ec2_private_key.value
    end
    target_params
  end
end
