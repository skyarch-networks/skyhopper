#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class CfTemplatesController < ApplicationController
  before_action :set_cf_template, only: %i[show edit update destroy]
  before_action :new_cf_template, only: %i[insert_cf_params create create_and_send]

  # --------------- auth
  before_action :authenticate_user!

  before_action do
    infra_id = begin
                 params[:infra_id] || params[:cf_template][:infrastructure_id]
               rescue StandardError
                 nil
               end
    authorize(@cf_template || CfTemplate.new(infrastructure_id: infra_id))
  end

  include Concerns::InfraLogger

  # GET /cf_templates
  # GET /cf_templates.json
  def index
    page = params[:page] || 1

    @global_jsons = CfTemplate.global

    respond_to do |format|
      format.json { @global_jsons = @global_jsons }
      format.html { @global_jsons = @global_jsons.page(page) }
    end
  end

  # GET /cf_templates/1
  # GET /cf_templates/1.json
  def show
    respond_to do |format|
      format.html { render partial: 'show' }
      format.json do
        if @cf_template.user_id
          u = User.find(@cf_template.user_id)
          @operator = { email: u[:email], is_admin: u[:admin] }
        else
          @operator = { email: I18n.t('users.unregistered'), is_admin: 0 }
        end
        render 'show.json'
      end
    end
  end

  # GET /cf_templates/new
  def new
    @cf_template = CfTemplate.new
  end

  # GET /cf_templates/new_for_creating_stack
  # params: infrastructure_id
  def new_for_creating_stack
    infra_id = params.require(:infrastructure_id)

    histories = CfTemplate.for_infra(infra_id)
    # TODO: 変数名変えたほうがいいんじゃ
    globals = CfTemplate.global

    render json: {
      histories: histories,
      globals: globals,
    } and return
  end

  # GET /cf_templates/1/edit
  def edit; end

  # POST /cf_templates/insert_cf_params
  def insert_cf_params
    infra = Infrastructure.find(cf_template_params[:infrastructure_id])

    begin
      @tpl = @cf_template.parse_value
    rescue CfTemplate::ParseError => ex
      render plain: ex.message, status: :bad_request and return
    end

    begin
      @cf_template.validate_template
    rescue Aws::CloudFormation::Errors::ValidationError => ex
      render plain: ex.message, status: :bad_request and return
    end

    # create EC2 instance ?
    if @tpl['Parameters'].try(:include?, 'KeyName')
      unless infra.ec2_private_key_id
        render plain: I18n.t('cf_templates.msg.keypair_missing'), status: :bad_request and return
      end
      @tpl['Parameters'].delete('KeyName')
    end

    render json: @tpl['Parameters']
  end

  # POST /cf_templates
  # POST /cf_templates.json
  def create
    begin
      @cf_template.validate_template
    rescue StandardError => ex
      flash[:alert] = ex.message
      render action: 'new' and return
    end

    respond_to do |format|
      if @cf_template.save
        format.html { redirect_to cf_templates_path, notice: I18n.t('cf_templates.msg.created') }
        format.json { render action: 'show', status: :created, location: @client }
      else
        format.html do
          flash.now[:alert] = @cf_template.errors[:json] if @cf_template.errors[:json]
          render action: 'new'
        end
        format.json { render json: @cf_template.errors, status: :unprocessable_entity }
      end
    end
  end

  # POST /cf_template/create_and_send
  # Create cf_template and send template to cloudformation for creating stack
  def create_and_send
    @cf_template.user_id = current_user.id

    res = send_cloudformation_template(@cf_template, params[:cf_template][:cfparams])

    if res[:status]
      render plain: res[:message] and return
    end
    render plain: res[:message], status: :internal_server_error
  end

  # PATCH/PUT /cf_templates/1
  # PATCH/PUT /cf_templates/1.json
  def update
    respond_to do |format|
      if @cf_template.update(cf_template_params)
        format.html { redirect_to cf_templates_path, notice: I18n.t('cf_templates.msg.updated') }
        format.json { head :no_content }
      else
        format.html { render action: 'edit' }
        format.json { render json: @cf_template.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /cf_templates/1
  # DELETE /cf_templates/1.json
  def destroy
    @cf_template.destroy
    respond_to do |format|
      format.html { redirect_to cf_templates_url, notice: I18n.t('cf_templates.msg.deleted') }
      format.json { head :no_content }
    end
  end

  def history
    infra_id = params.require(:infrastructure_id)
    @histories = CfTemplate.for_infra(infra_id)
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_cf_template
    @cf_template = CfTemplate.find(params.require(:id))
  end

  def new_cf_template
    @cf_template = CfTemplate.new(cf_template_params)
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def cf_template_params
    params.require(:cf_template).permit(:infrastructure_id, :name, :detail, :value, :format, :params)
  end

  def send_cloudformation_template(cf_template, template_parameters)
    infrastructure = Infrastructure.find(cf_template.infrastructure_id)
    stack = Stack.new(infrastructure)

    begin
      cf_template.parse_value
    rescue CfTemplate::ParseError => ex
      return { message: ex.message, status: false }
    end

    cf_template.create_cfparams_set(infrastructure, template_parameters)

    begin
      action = stack.apply_template(cf_template.value, cf_template.parsed_cfparams)
    rescue StandardError => ex
      return { message: ex.message, status: false }
    end

    infrastructure.status = stack.status[:message]
    infrastructure.save!

    add_keys_in_known_hosts(infrastructure)

    cf_template.update_cfparams

    cf_template.save!

    infra_logger_success("#{action} stack is being started.", infrastructure_id: infrastructure.id)
    { message: t("cf_templates.msg.#{action.downcase}"), status: true }
  end

  def add_keys_in_known_hosts(infrastructure)
    Thread.new_with_db do
      begin
        Rails.logger.info("[add_keys_in_known_hosts] Add keys in known_hosts is started. infra_id: #{infrastructure.id}")

        stack = Stack.new(infrastructure)

        Rails.logger.info("[add_keys_in_known_hosts] Waiting creat complate or update complete. stack_name: #{stack.name}")
        stack.wait_creat_complate_or_update_complete

        infrastructure.resources.destroy_all
        infrastructure.save!
        infrastructure.reload
        resources = infrastructure.resources_or_create

        ec2_resources = resources.ec2
        ec2_resources.each do |ec2_resource|
          instance = infrastructure.instance(ec2_resource.physical_id)
          instance.wait_status(:running)
          instance.wait_status_check_ok
          instance.register_in_known_hosts(tries: 12, sleep: 5)
          ec2_resource.register_in_known_hosts = true
          ec2_resource.save!
        end
      rescue StandardError => ex
        Rails.logger.error("[add_keys_in_known_hosts] Add keys in known_hosts is failed. infra_id: #{infrastructure.id}")
        Rails.logger.error ex
      else
        Rails.logger.info("[add_keys_in_known_hosts] Add keys in known_hosts is finished. infra_id: #{infrastructure.id}")
      end
    end
  end
end
