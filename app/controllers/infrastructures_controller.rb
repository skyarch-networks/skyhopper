# -*- coding: utf-8 -*-
#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
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
  before_action :infrastructure_exist, only: [:show, :edit, :update, :destroy, :delete_stack, :stack_events]


  before_action :set_infrastructure, only: [:show, :edit, :update, :destroy, :delete_stack, :stack_events]

  before_action :keypair_validation, only: [:create]

  before_action do
    infra = @infrastructure || (
      project_id = params[:project_id] || params[:infrastructure][:project_id] rescue nil
      Infrastructure.new(project_id: project_id)
    )

    authorize(infra)
  end


  before_action :with_zabbix, only: [:destroy, :delete_stack]

  @@regions = AWS::Regions



  # GET /infrastructures
  # GET /infrastructures.json
  def index
    project_id = params.require(:project_id)
    session[:project_id] = project_id
    page       = params[:page] || 1

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
    stack = Stack.new(@infrastructure)

    resp = {
      status:        stack.status_and_type,
      name:          @infrastructure.stack_name,
      token_invalid: stack.status[:message].eql?("The security token included in the request is invalid."),
    }

    # When stack does not exist
    unless stack.status[:available] # in many cases, it will be when stack does not exist.
      @infrastructure.status = ""
      @infrastructure.save!
      @infrastructure.resources.destroy_all

      resp[:message] = stack.status[:message]
    end

    if stack.update_complete?
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
    infra = Infrastructure.create_with_ec2_private_key!(infrastructure_params)
  rescue => ex
    flash[:alert] = ex.message
    @regions        = @@regions
    @infrastructure = Infrastructure.new(infrastructure_params(no_keypair: true))

    render action: 'new', status: 400 and return
  else
    redirect_to infrastructures_path(project_id: infra.project_id),
      notice: I18n.t('infrastructures.msg.created')
  end

  # PATCH/PUT /infrastructures/1
  # PATCH/PUT /infrastructures/1.json
  def update
    begin
      @infrastructure.update!(infrastructure_params)
    rescue => ex
      @regions = @@regions
      flash[:alert] = ex.message
      render action: :edit, status: 400 and return
    end

    redirect_to infrastructures_path(project_id: @infrastructure.project_id),
      notice: I18n.t('infrastructures.msg.updated')
  end

  # DELETE /infrastructures/1
  # DELETE /infrastructures/1.json
  ## detach
  def destroy
    @infrastructure.destroy!

    render text: I18n.t('infrastructures.msg.detached')
  end

  # POST /infrastructures/1/delete_stack
  def delete_stack
    @infrastructure.detach_zabbix
    @infrastructure.detach_chef

    begin
      stack = Stack.new(@infrastructure)
      stack.delete # it returns nil without exception if there is no stack in the region
    rescue => ex
      logger.error "#{ex.class}: #{ex.message.inspect}"
      logger.error ex.backtrace.join("\n")
      @infrastructure.status = stack.status[:status]
      @infrastructure.save!
      infra_logger_fail("Deleting stack is failed. \n #{ex.class}: #{ex.message.inspect} \n" + ex.backtrace.join("\n"))

      raise ex
    end

    infra_logger_success("Deleting stack is successfully started.")

    @infrastructure.resources.destroy_all
    @infrastructure.monitorings.delete_all

    render text: I18n.t('infrastructures.msg.delete_stack_started'), status: 202 and return
  end

  def show_rds
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:id)

    infra = Infrastructure.find(infra_id)
    rds = RDS.new(infra, physical_id)

    @db_instance_class = rds.db_instance_class
    @allocated_storage = rds.allocated_storage
    @endpoint_address  = rds.endpoint_address
    @multi_az          = rds.multi_az
    @engine            = rds.engine
  end

  # GET /infrastructures/show_elb
  def show_elb
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:id)

    infra = Infrastructure.find(infra_id)
    elb = ELB.new(infra, physical_id)

    @ec2_instances = elb.instances
    @dns_name      = elb.dns_name
    @listeners     = elb.listeners

    ec2 = infra.resources.ec2
    @unregistereds = ec2.reject{|e| @ec2_instances.map{|x|x[:instance_id]}.include?(e.physical_id)}

    list_server_certificates = elb.list_server_certificates

    @server_certificate_name_items = list_server_certificates[0].reject{|crt| crt.nil?}.map do |crt|
      {
        text: crt['server_certificate_name'],
        value: crt['arn'],
      }
    end

    @server_certificates = list_server_certificates[0].reject{|crt| crt.nil?}.map do |crt|
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

    before_type = rds.db_instance_class

    begin
      changed_type = rds.change_scale(type)
    rescue RDS::ChangeScaleError => ex
      render text: ex.message, status: 400 and return
    end

    if before_type == changed_type
      render text: "There is not change '#{type}'", status: 200 and return
    end

    # TODO: status を取得

    render text: "change scale to #{type}" and return
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

    @operation_schedule = resource.operation_durations.order("created_at desc")

    respond_to do |format|
      format.json { render json: @operation_schedule.as_json(only: [:id, :start_date, :end_date],
        include: [{recurring_date: {only: [:id, :repeats, :start_time, :end_time, :dates]}},
                  {resource: {only: [:physical_id]}} ])
      }
    end
  end

  # POST /infrastructures/save_schedule
  # @param [Integer] infra_id
  # @param [String] physical_id
  # @param [Object] selected_instance
  def save_schedule
    physical_id = params.require(:physical_id)
    selected_instance =  params.require(:selected_instance)
    ops_exists = OperationDuration.find_by(resource_id: selected_instance[:id])
    start_date = Time.at(selected_instance[:start_date].to_i).in_time_zone
    end_date = Time.at(selected_instance[:end_date].to_i).in_time_zone
    if ops_exists
      ops_exists.start_date = start_date
      ops_exists.end_date =  end_date
      ops_exists.save

      recur_exits = RecurringDate.find_by(operation_duration_id: ops_exists.id)
      recur_exits.repeats = selected_instance[:repeat_freq].to_i
      recur_exits.start_time = start_date.strftime("%H:%M")
      recur_exits.end_time = end_date.strftime("%H:%M")
      recur_exits.dates = selected_instance[:dates]
      recur_exits.save
    else
      begin
        ops = OperationDuration.create!(
          resource_id:  selected_instance[:id],
          start_date:   start_date,
          end_date:     end_date,
        )
        RecurringDate.create!(
          operation_duration_id: ops.id,
          repeats: selected_instance[:repeat_freq].to_i,
          start_time:  start_date.strftime("%H:%M"),
          end_time: end_date.strftime("%H:%M"),
          dates: selected_instance[:dates],
        )
      rescue => ex
        render text: ex.message, status: 500 and return
      end
    end


    render text: I18n.t('operation_scheduler.msg.saved'), status: 200 and return
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
    return p
  end

  # raise error if uploaded keypair does not exist
  def keypair_validation
    p = infrastructure_params

    KeyPair.validate!(p[:project_id], p[:region], p[:keypair_name], p[:keypair_value])
  end

  # redirect to projects#index if specified project does not exist
  def project_exist
    return if params[:project_id].blank?
    return if Project.exists?(id: params[:project_id])

    if current_user.master?
      if session[:client_id].present?
        path = projects_path(client_id: session[:client_id])
      else
        path = clients_path
      end
    else
      path = projects_path
    end

    redirect_to path, alert: "Project \##{params[:project_id]} does not exist."
  end

  # redirect to projects#index if specified project does not exist
  def infrastructure_exist
    return if params[:id].blank?
    return if Infrastructure.exists?(id: params[:id])

    msg = "Infrastructure \##{params[:id]} does not exist."
    if session[:project_id].present?
      path = infrastructures_path(project_id: session[:project_id])
    else
      if current_user.master?
        path = clients_path
      else
        path = projects_path
      end
    end

    redirect_to path, alert: msg
  end
end
