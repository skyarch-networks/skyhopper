#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerspecsController < ApplicationController
  include Concerns::InfraLogger

  before_action :set_serverspec, only: [:update, :show, :edit, :destroy]

  # --------------- Auth
  before_action :authenticate_user!

  before_action do
    authorize(@serverspec || Serverspec.new(infrastructure_id: have_infra?))
  end

  # GET /serverspecs
  def index
    @infrastructure_id = params[:infrastructure_id]
    page               = params[:page]

    @infrastructure_name = Infrastructure.find(@infrastructure_id).stack_name if @infrastructure_id
    @serverspecs = Serverspec.where(infrastructure_id: @infrastructure_id).page(page)

    respond_to do |format|
      format.json
      format.html
    end
  end

  # GET /serverspecs/new
  def new
    infra_id = params[:infrastructure_id]

    @serverspec = Serverspec.new(infrastructure_id: infra_id)
    @serverspec.value = %!require 'serverspec_helper'\n\n!
  end

  # GET /serverspecs/1
  def show
    render text: @serverspec.value
  end

  # POST /serverspecs/1
  def update
    if @serverspec.update(global_serverspec_params)
      redirect_to serverspecs_path, notice: I18n.t('serverspecs.msg.updated')
    else
      flash.now[:alert] = @serverspec.errors[:value] if @serverspec.errors[:value]
      render action: 'edit'
    end
  end

  # POST /serverspecs
  def create
    @serverspec = Serverspec.new(global_serverspec_params)

    infra_id = @serverspec.infrastructure_id

    if @serverspec.save
      redirect_to serverspecs_path(infrastructure_id: infra_id),
        notice: I18n.t('serverspecs.msg.created')
    else
      flash.now[:alert] = @serverspec.errors[:value] if @serverspec.errors[:value]
      render action: 'new', infrastructure_id: infra_id
    end
  end

  # GET /serverspecs/1/edit
  def edit
  end

  # DELETE /serverspecs/1
  def destroy
    infra_id = @serverspec.infrastructure_id
    @serverspec.destroy

    redirect_to serverspecs_path(infrastructure_id: infra_id), notice: I18n.t('serverspecs.msg.deleted')
  end

  # GET /serverspecs/select
  def select
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)

    resource = Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id)
    @selected_serverspec_ids = resource.all_serverspec_ids

    serverspecs = Serverspec.for_infra(infra_id)
    @individual_serverspecs, @global_serverspecs = serverspecs.partition{|spec| spec.infrastructure_id }
    node = Node.new(physical_id)
    @is_available_auto_generated = node.have_auto_generated

    @serverspec_schedule = ServerspecSchedule.find_or_create_by(physical_id: physical_id)
  end

  # GET /serverspecs/results
  def results
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)
    resource = Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id)

    @serverspec_results = resource.serverspec_results.includes(:serverspec_result_details, :serverspecs, :resource)

    respond_to do |format|
      format.json { render json: @serverspec_results.as_json(only: [:id, :status, :message], include: [:serverspec_result_details, {serverspecs: {only:[:name]}}, {resource: {only: [:physical_id]}} ]) }
    end
  end


  # TODO: refactor
  # POST /serverspecs/run
  def run
    physical_id    = params.require(:physical_id)
    infra_id       = params.require(:infra_id)
    serverspec_ids = params.require(:serverspec_ids)
    resource = Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id)
    if selected_auto_generated = serverspec_ids.include?('-1')
      serverspec_ids.delete('-1')
    end

    infra_logger_serverspec_start(selected_auto_generated, serverspec_ids)

    begin
      resp = ServerspecJob.perform_now(
        physical_id, infra_id, current_user.id,
        serverspec_ids: serverspec_ids, auto_generated: selected_auto_generated
      )
    rescue => ex
      # serverspec が正常に実行されなかったとき
      render text: ex.message, status: 500 and return
    end

    case resp[:status_text]
    when 'success'
      ServerspecResult.create(resource_id: resource.id, status: resp[:status_text],message: resp[:message], serverspec_ids: serverspec_ids)
      render_msg = I18n.t('serverspecs.msg.success', physical_id: physical_id)
    when 'pending'
      ServerspecResult.create(resource_id: resource.id, status: resp[:status_text],message: resp[:message], serverspec_ids: serverspec_ids)
      render_msg = I18n.t('serverspecs.msg.pending', physical_id: physical_id, pending_specs: resp[:message])
    when 'failed'
      ServerspecResult.create(resource_id: resource.id, status: resp[:status_text],message: resp[:message], serverspec_ids: serverspec_ids)
      render_msg = I18n.t('serverspecs.msg.failure', physical_id: physical_id, failure_specs: resp[:message])
    end

    render text: render_msg, status: 200 and return
  end


  # Generate serverspec to connect to RDS instance
  # PUT /serverspecs/create_for_rds
  def create_for_rds
    infra_id    = params.require(:infra_id)
    physical_id = params.require(:physical_id)
    username    = params.require(:username)
    password    = params.require(:password)
    database    = params[:database]
    database = nil if database.blank?

    infra = Infrastructure.find(infra_id)
    rds = RDS.new(infra, physical_id)

    Serverspec.create_rds(rds, username, password, infra_id, database)

    render text: I18n.t('serverspecs.msg.generated'), status: 201 and return
  end

  # POST /serverspecs/schedule
  def schedule
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)
    schedule    = params.require(:schedule).permit(:enabled, :frequency, :day_of_week, :time)

    ss = ServerspecSchedule.find_by(physical_id: physical_id)
    ss.update_attributes!(schedule)

    if ss.enabled?
      PeriodicServerspecJob.set(
        wait_until: ss.next_run
      ).perform_later(physical_id, infra_id, current_user.id)
    end

    render text: I18n.t('schedules.msg.serverspec_updated'), status: 200 and return
  end


  private

  def set_serverspec
    @serverspec = Serverspec.find(params.require(:id))
  end

  def global_serverspec_params
    params.require(:serverspec).permit(:name, :description, :value, :infrastructure_id)
  end

  def have_infra?
    return params[:infra_id] || params[:infrastructure_id] || params[:serverspec][:infrastructure_id]
  rescue
    return nil
  end
end
