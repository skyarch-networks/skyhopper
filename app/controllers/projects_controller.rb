#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ProjectsController < ApplicationController

  # ------------- Auth
  before_action :authenticate_user!

  # --------------- existence check
  before_action :client_exist, only: [:index]
  before_action :project_exist, only: [:edit, :update, :destroy]

  before_action only: [:index] do
    if current_user.master && !params[:client_id]
      redirect_to clients_path
    end
  end

  before_action :set_project, only: [:edit, :update, :destroy]
  before_action do
    client_id = params[:client_id] || params[:project][:client_id] rescue nil
    authorize(@project || Project.new(client_id: client_id))
  end

  before_action :with_zabbix, only: [:destroy, :create, :new]


  # GET /projects
  # GET /projects.json
  def index
    @selected_project_id = params[:project_id].to_i
    page = params[:page] || 1

    if current_user.master?
      client_id = params.require(:client_id)
      session[:client_id] = client_id

      @selected_client = Client.find_by(id: client_id)
      @projects        = @selected_client.projects
    else
      @projects = current_user.projects
    end
    respond_to do |format|
      format.json
      format.html 
    end
  end

  # GET /projects/new
  def new
    client_id = params.require(:client_id)

    @project = Project.new
    @project.client_id = client_id

    @cloud_providers = CloudProvider.all
  end

  # GET /projects/1/edit
  def edit
    @cloud_providers = CloudProvider.all
  end

  # POST /projects
  # POST /projects.json
  def create
    @project = Project.new(project_params)

    on_error = -> () {redirect_to new_project_path(client_id: params[:project][:client_id])}

    unless @project.save
      flash[:alert] = @project.errors
      on_error.() and return
    end

    begin
      s = AppSetting.get
      z = Zabbix.new(s.zabbix_user, s.zabbix_pass)
      # add new hostgroup on zabbix with project code as its name
      hostgroup_id = z.add_hostgroup(@project.code)
      z.create_usergroup(@project.code + '-read',       hostgroup_id, Zabbix::PermissionRead)
      z.create_usergroup(@project.code + '-read-write', hostgroup_id, Zabbix::PermissionReadWrite)

      hostgroup_names = Project.pluck(:code)
      hostgroup_ids = z.get_hostgroup_ids(hostgroup_names)
      z.change_mastergroup_rights(hostgroup_ids)

      redirect_to projects_path(client_id: @project.client_id),
        notice: I18n.t('projects.msg.created') and return
    rescue => ex
      # In many case, create hostgroup was failed.
      # If use Project#destroy, Project detached from zabbix by model hook.
      @project.delete
      flash[:alert] = ex.message

      on_error.() and return
    end
  end

  # PATCH/PUT /projects/1
  # PATCH/PUT /projects/1.json
  def update
    if @project.update(project_params)
      redirect_to projects_path(client_id: @project.client_id),
        notice: I18n.t('projects.msg.updated')
    else
      flash[:alert] = @project.errors.full_messages.join(" ")
      redirect_to edit_project_path(params) and return
    end
  end

  # DELETE /projects/1
  # DELETE /projects/1.json
  def destroy
    go = -> (){redirect_to(projects_path(client_id: @project.client_id))}

    begin
      @project.destroy!
    rescue => ex
      flash[:alert] = ex.message
      go.() and return
    end

    flash[:notice] = I18n.t('projects.msg.deleted')
    go.() and return
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_project
    @project = Project.find(params.require(:id))
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def project_params
    params.require(:project).permit(:code, :client_id, :name, :access_key, :secret_access_key, :cloud_provider_id)
  end

  # redirect to clients#index if specified client does not exist
  # only for "master" roled user
  def client_exist
    return if params[:client_id].blank?

    unless Client.exists?(id: params[:client_id])
      redirect_to clients_path, alert: "Client \##{params[:client_id]} does not exist."
    end
  end

  # redirect to projects#index if specified project does not exist
  def project_exist
    return if params[:id].blank?
    return if Project.exists?(id: params[:id])

    msg = "Project \##{params[:id]} does not exist."

    unless current_user.master?
      redirect_to projects_path, alert: msg and return
    end

    if session[:client_id].present?
      redirect_to projects_path(client_id: session[:client_id]), alert: msg
    else
      redirect_to clients_path, alert: msg
    end
  end
end
