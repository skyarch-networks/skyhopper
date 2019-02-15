#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServertestsController < ApplicationController
  include Concerns::InfraLogger
  class ServertestError < ::StandardError; end

  before_action :set_servertest, only: [:update, :show, :edit, :destroy]

  # --------------- Auth
  before_action :authenticate_user!

  before_action do
    authorize(@serverspec || Servertest.new(infrastructure_id: have_infra?))
  end

  # GET /servertests
  def index
    @infrastructure_id = params[:infrastructure_id]
    page               = params[:page]

    @infrastructure_name = Infrastructure.find(@infrastructure_id).stack_name if @infrastructure_id
    @servertests = Servertest.where(infrastructure_id: @infrastructure_id).page(page)

    respond_to do |format|
      format.json
      format.html
    end
  end

  # GET /servertests/new
  def new
    infra_id = params[:infrastructure_id]

    @servertest = Servertest.new(infrastructure_id: infra_id)
    @servertest.value = %!require '<choice_category>spec_helper'\n\n!
  end

  # GET /servertests/1
  def show
    render text: @servertest.value
  end

  # POST /servertests/1
  def update
    if @servertest.update(global_servertest_params)
      infra_id = @servertest.infrastructure_id
      redirect_to servertests_path(infrastructure_id: infra_id), notice: I18n.t('servertests.msg.updated')
    else
      flash.now[:alert] = @servertest.errors[:value] if @servertest.errors[:value]
      render action: 'edit'
    end
  end

  # POST /servertests
  def create
    @servertest = Servertest.new(global_servertest_params)

    infra_id = @servertest.infrastructure_id

    begin
      @servertest.save!
    rescue => ex
      raise ex if ajax?
      flash.now[:alert] = @servertest.errors[:value] if @servertest.errors[:value]
      render action: 'new', infrastructure_id: infra_id; return
    end

    if ajax?
      render text: I18n.t('servertests.msg.created') and return
    else
      redirect_to servertests_path(infrastructure_id: infra_id),
        notice: I18n.t('servertests.msg.created')
    end
  end

  # GET /servertests/1/edit
  def edit; end # Rubocop fix

  # GET /servertests/generator
  def generator
    @infra = Infrastructure.find(params[:infrastructure_id]) if params[:infrastructure_id]
  end

  # GET /servertests/awspec_generator
  def awspec_generator
    @infras = Infrastructure.all
  end

  # GET /servertests/generate_awspec
  def generate_awspec
    @infra = Infrastructure.find(params[:infrastructure_id]) if params[:infrastructure_id]

    ws = WSConnector.new('awspec-generate', @infra.id)
    ruby_cmd = File.join(RbConfig::CONFIG['bindir'],  RbConfig::CONFIG['ruby_install_name'])

    cmd = []
    cmd << "AWS_ACCESS_KEY_ID=#{@infra.access_key}"
    cmd << "AWS_REGION=#{@infra.region}"
    cmd << "AWS_SECRET_ACCESS_KEY=#{@infra.secret_access_key}"
    cmd << ruby_cmd << "-S awspec generate ec2 #{@infra.ec2.describe_vpcs[:vpcs][0].vpc_id}"
    cmd = cmd.flatten.reject(&:blank?).join(" ")
    generated = %!require 'awspec_helper'\n\n!
    Thread.new_with_db do
      begin
        gen, = Node.exec_command(cmd, ServertestError)
        generated += gen
        ws.push_as_json({status: true, message: I18n.t('zabbix_servers.msg.created'), generated: generated})
      rescue => ex
        generated = ex.to_s
        ws.push_as_json({status: false, message: ex.message})
        render status: 404 and return
      end
    end

    render nothing: true, status: 200 and return
  end

  # DELETE /servertests/1
  def destroy
    infra_id = @servertest.infrastructure_id
    @servertest.destroy

    redirect_to servertests_path(infrastructure_id: infra_id), notice: I18n.t('servertests.msg.deleted')
  end

  # GET /servertests/select
  def select
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)

    resource = Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id)
    @selected_servertest_ids = resource.all_servertest_ids

    servertests = Servertest.for_infra_serverspec(infra_id)
    @individual_servertests, @global_servertests = servertests.partition{|spec| spec.infrastructure_id }

    @servertest_schedule = ServertestSchedule.find_or_create_by(physical_id: physical_id)
  end

  # GET /servertests/results
  def results
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)
    resource = Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id)

    @servertest_results = resource.servertest_results.order("created_at desc")

    respond_to do |format|
      format.json { render json: @servertest_results.as_json(only: [:id, :auto_generated_servertest, :status, :message, :created_at, :category],
        include: [{servertest_result_details: {only: [:id]}},{servertests: {only: [:name, :category]}}, {resource: {only: [:physical_id]}} ]) }
    end
  end


  # TODO: refactor
  # POST /servertests/run_serverspec
  def run_serverspec
    physical_id    = params.require(:physical_id)
    infra_id       = params.require(:infra_id)
    servertest_ids = params.require(:servertest_ids)
    resource = Resource.where(infrastructure_id: infra_id).find_by(physical_id: physical_id)

    begin
      resp = ServertestJob.perform_now(
        physical_id, infra_id, current_user.id,
        servertest_ids: servertest_ids
      )
    rescue => ex
      # serverspec が正常に実行されなかったとき
      render text: ex.message, status: 500 and return
    end

    case resp[:status_text]
    when 'success'
      render_msg = I18n.t('servertests.msg.success', physical_id: physical_id)
    when 'pending'
      render_msg = I18n.t('servertests.msg.pending', physical_id: physical_id, pending_specs: resp[:short_msg])
    when 'failed'
      render_msg = I18n.t('servertests.msg.failure', physical_id: physical_id, failure_specs: resp[:short_msg])
    when 'error'
      render_msg = I18n.t('servertests.msg.error', physical_id: physical_id, error_specs: resp[:error_servertest_names].join(','))
    end

    ServertestResult.create(
      resource_id:    resource.id,
      auto_generated_servertest: false,
      status:         resp[:status_text],
      message:        resp[:long_message],
      servertest_ids: servertest_ids
    )
    render text: render_msg, status: 200 and return
  end


  # Generate serverspec to connect to RDS instance
  # PUT /servertests/create_for_rds
  def create_for_rds
    infra_id    = params.require(:infra_id)
    physical_id = params.require(:physical_id)
    username    = params.require(:username)
    password    = params.require(:password)
    database    = params[:database]
    database = nil if database.blank?

    infra = Infrastructure.find(infra_id)
    rds = RDS.new(infra, physical_id)

    Servertest.create_rds(rds, username, password, infra_id, database)

    render text: I18n.t('servertests.msg.generated'), status: 201 and return
  end

  # POST /servertests/schedule
  def schedule
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)
    schedule    = params.require(:schedule).permit(:enabled, :frequency, :day_of_week, :time)

    ss = ServertestSchedule.find_by(physical_id: physical_id)
    ss.update_attributes!(schedule)

    if ss.enabled?
      PeriodicServerspecJob.set(
        wait_until: ss.next_run
      ).perform_later(physical_id, infra_id, current_user.id)
    end

    render text: I18n.t('schedules.msg.serverspec_updated'), status: 200 and return
  end


  private

  def set_servertest
    @servertest = Servertest.find(params.require(:id))
  end

  def global_servertest_params
    params.require(:servertest).permit(:name, :description, :value, :infrastructure_id, :category)
  end

  def have_infra?
    return params[:infra_id] || params[:infrastructure_id] || params[:serverspec][:infrastructure_id]
  rescue
    return nil
  end
end
