#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerspecsController < ApplicationController
  include Concerns::BeforeAuth
  include Concerns::InfraLogger

  before_action :set_serverspec, only: [:update, :show, :edit, :destroy]

  # --------------- Auth
  before_action :authenticate_user!

  before_action except: [:index, :show] do
    if infra_id = have_infra?
      allowed_infrastructure(infra_id)
    else
      master and admin
    end
  end

  before_action only: [:index, :show] do
    if infra_id = have_infra?
      allowed_infrastructure(infra_id)
    end
  end


  # GET /serverspecs
  def index
    @infrastructure_id = params[:infrastructure_id]
    page               = params[:page]

    @infrastructure_name = Infrastructure.find(@infrastructure_id).stack_name if @infrastructure_id
    @serverspecs = Serverspec.where(infrastructure_id: @infrastructure_id).page(page).per(10)
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
    physical_id       = params.require(:physical_id)
    infrastructure_id = params.require(:infra_id)

    node    = Node.new(physical_id)
    dish_id = node.details['normal']['dish_id'].to_i
    if dish_id == 0     # when no apply dish
      @selected_serverspec_ids = []
    else
      @selected_serverspec_ids = Dish.find(dish_id).serverspecs.map(&:id)
    end

    serverspecs = Serverspec.for_infra(infrastructure_id)
    @individual_serverspecs, @global_serverspecs = serverspecs.partition{ |spec| spec.infrastructure_id }
    @is_available_auto_generated = node.have_auto_generated
  end

  # TODO: refactor
  # POST /serverspecs/run
  def run
    physical_id       = params.require(:physical_id)
    infrastructure_id = params.require(:infra_id)
    serverspec_ids    = params.require(:serverspec_ids)

    selected_auto_generated =
      if serverspec_ids.include?('-1') then
        serverspec_ids.delete('-1')
        true
      else
        false
      end

    infra_logger_serverspec_start(selected_auto_generated, serverspec_ids)

    begin
      server_spec_response = Node.new(physical_id).run_serverspec(infrastructure_id, serverspec_ids, selected_auto_generated)
    rescue => ex
      # serverspec が正常に実行されなかったとき
      logger.error ex

      infra_logger_fail("serverspec for #{physical_id} is failed. results: \n#{ex.message}")
      Rails.cache.write(ServerspecStatus::TagName + physical_id, ServerspecStatus::Failed)

      render text: ex.message, status: 500 and return
    else
      if server_spec_response[:summary][:failure_count] != 0 then
        failed_specs = server_spec_response[:examples].select{|x| x[:status] == 'failed'}.map{|x| x[:full_description]}
        server_spec_status = false
        server_spec_msg    = "serverspec for #{physical_id} is failed. failure specs: \n#{failed_specs.join("\n")}"
        Rails.cache.write(ServerspecStatus::TagName + physical_id, ServerspecStatus::Failed)
      elsif server_spec_response[:summary][:pending_count] != 0 then
        pending_specs = server_spec_response[:examples].select{|x| x[:status] == 'pending'}.map{|x| x[:full_description]}
        server_spec_status = true
        server_spec_msg    = "serverspec for #{physical_id} is successfully finished. but have pending specs: \n#{pending_specs.join("\n")}"
        Rails.cache.write(ServerspecStatus::TagName + physical_id, ServerspecStatus::Pending)
      else
        server_spec_status = true
        server_spec_msg    = "serverspec for #{physical_id} is successfully finished."
        Rails.cache.write(ServerspecStatus::TagName + physical_id, ServerspecStatus::Success)
      end

      infra_logger(server_spec_msg, server_spec_status)

      render_msg =
        if server_spec_status
          if pending_specs
            I18n.t('serverspecs.msg.pending', physical_id: physical_id, pending_specs: pending_specs.join("\n"))
          else
            I18n.t('serverspecs.msg.success', physical_id: physical_id)
          end
        else
          I18n.t('serverspecs.msg.failure', physical_id: physical_id, failure_specs: failed_specs.join("\n"))
        end
      render text: render_msg, status: 200 and return
    end
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


  private

  def set_serverspec
    @serverspec = Serverspec.find(params.require(:id))
  end

  def global_serverspec_params
    params.require(:serverspec).permit(:name, :description, :value, :infrastructure_id)
  end

  def have_infra?
    return params[:infra_id] || params[:infrastructure_id] || (@serverspec.infrastructure_id rescue nil) || params[:serverspec][:infrastructure_id]
  rescue
    return nil
  end
end
