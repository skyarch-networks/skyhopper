#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class InfrastructuresController < ApplicationController
  include Concerns::BeforeAuth
  include Concerns::InfraLogger

  # --------------- Auth
  before_action :authenticate_user!

  # --------------- existence check
  before_action :project_exist, only: [:index]
  before_action :infrastructure_exist, only: [:show, :edit, :update, :destroy, :delete_stack, :stack_events]


  before_action :set_infrastructure, only: [:show, :edit, :update, :destroy, :delete_stack, :stack_events]

  # admin
  before_action only: [:new, :create, :edit, :update, :destroy, :delete_stack] do
    project_id = params[:project_id] || (params[:infrastructure][:project_id] rescue nil) || @infrastructure.project_id
    admin(infrastructures_path(project_id: project_id))
  end

  # admin でも new, create はできる？
  # master
  # before_action only: [:new, :create] do
  #   project_id = params[:project_id] || params[:infrastructure][:project_id]
  #   master(infrastructures_path(project_id: project_id))
  # end

  # project
  before_action only: [:index] do
    project_id = params[:project_id]
    allowed_project(project_id)
  end

  # infra
  before_action except: [:index, :new, :create] do
    infra_id = params[:infra_id] || params[:infrastructure_id] || params[:id]
    allowed_infrastructure(infra_id)
  end

  before_action :with_zabbix_or_render, only: [:destroy, :delete_stack]

  @@regions = AWS::Regions



  # GET /infrastructures
  def index
    project_id = params.require(:project_id)
    session[:project_id] = project_id
    page       = params[:page] || 1

    @selected_project = Project.find(project_id)

    @infrastructures = @selected_project.infrastructures.includes(:ec2_private_key).page(page).per(10)

    @selected_client = @selected_project.client
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
      @infrastructure.resources.delete_all

      resp[:message] = stack.status[:message]
    end

    if stack.update_complete?
      @infrastructure.resources.delete_all
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
    rescue Aws::CloudFormation::Errors::ValidationError => ex # stack does not exist
    end

    render json: {
      stack_status: stack.status_and_type,
      stack_events: events
    } and return
  end

  # GET /infrastructures/new
  def new
    project_id = params.require(:project_id)
    @infrastructure = Infrastructure.new(
      project_id: project_id
    )
    @regions = @@regions
  end

  # GET /infrastructures/1/edit
  # スタック情報が取得できない場合のみ
  def edit
    if @infrastructure.status.present?
      redirect_to ( infrastructures_path(project_id: @infrastructure.project_id) ),
        alert: I18n.t('infrastructures.msg.not_necessary')
    end

    @regions = @@regions
  end

  # POST /infrastructures
  # POST /infrastructures.json
  def create
    begin
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
  end

  # PATCH/PUT /infrastructures/1
  # PATCH/PUT /infrastructures/1.json
  def update
    if @infrastructure.update(infrastructure_params)
      redirect_to infrastructures_path(project_id: @infrastructure.project_id),
        notice: I18n.t('infrastructures.msg.updated')
    else
      render action: 'edit'
    end
  end

  # DELETE /infrastructures/1
  # DELETE /infrastructures/1.json
  ## detach
  def destroy
    begin
      @infrastructure.destroy!
    rescue => ex
      render text: ex.message, status: 500 and return
    end

    render text: I18n.t('infrastructures.msg.detached')
  end

  # POST /infrastructures/1/delete_stack
  def delete_stack
    begin
      @infrastructure.detach_zabbix
    rescue => ex
      render text: ex.message, status: 500 and return
    end

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

      render text: I18n.t('infrastructures.msg.delete_stack_failed'), status: 500 and return
    end

    infra_logger_success("Deleting stack is successfully started.")

    @infrastructure.resources.delete_all
    @infrastructure.monitorings.delete_all

    render text: I18n.t('infrastructures.msg.delete_stack_started'), status: 202 and return
  end

  def show_rds
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)

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
    infra_id    = params.require(:infra_id)

    infra = Infrastructure.find(infra_id)
    elb = ELB.new(infra, physical_id)

    @ec2_instances = elb.instances
    @dns_name      = elb.dns_name
  end

  # POST /infrastructures/change_rds_scale
  def change_rds_scale
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)
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
    infra_id     = params.require(:infra_id)

    infrastructure = Infrastructure.find(infra_id)
    @s3 = S3.new(infrastructure, @bucket_name)

    render partial: 'show_s3'
  end


  def events
    infrastructure = Infrastructure.find( params.require(:infrastructure_id) )
    stack = Stack.new( infrastructure )
    begin
      render json: stack.events.to_json and return
    rescue Aws::CloudFormation::Errors::ValidationError => ex # stack does not exist
      render json: { error: ex.message }, status: 500 and return
    end
  end

  # Check Current cloudformation Status
  def cloudformation_status
    infrastructure = Infrastructure.find( params.require(:infrastructure_id) )
    stack = Stack.new( infrastructure )
    begin
      # TODO: Refactor
      # TODO: InfraLogの整形
      case
      when stack.in_progress?
        render json: stack.events.to_json and return
      when stack.complete?
        infra_logger_success("Creating stack complete.\n" + JSON.pretty_generate(stack.events))
        render nothing: true, status: 201 and return
      when stack.create_failed?
        infra_logger_fail("Creating stack failed.\n" + JSON.pretty_generate(stack.events))
        render text: I18n.t('infrastructures.msg.create_stack_failed'), status: 500 and return
      when stack.failed?
        infra_logger_fail("Creating stack failed.\n" + JSON.pretty_generate(stack.events))
        render text: stack.status[:status], status: 500 and return
      else
        render nothing: true, status: 201 and return
      end
    rescue Aws::CloudFormation::Errors::ValidationError => ex
      # in many cases, delete complete
      # TODO: handle delete complete as success
      render text: ex.message, status: 201 and return
    end
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

  # redirect to projects#index if specified project does not exist
  def project_exist
    return if params[:project_id].blank?

    unless Project.exists?(id: params[:project_id])
      msg = "Project \##{params[:project_id]} does not exist."
      if current_user.master?
        if session[:client_id].present?
          path = projects_path(client_id: client_id)
        else
          path = clients_path
        end
      else
        path = projects_path
      end

      redirect_to path, alert: msg
    end
  end

  # redirect to projects#index if specified project does not exist
  def infrastructure_exist
    return if params[:id].blank?

    unless Infrastructure.exists?(id: params[:id])
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
end
