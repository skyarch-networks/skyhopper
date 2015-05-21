#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class UsersAdminController < ApplicationController
  before_action :authenticate_user!
  before_action do
    authorize User.new
  end

  before_action :with_zabbix_or_back, only: [:new, :create, :destroy]
  before_action :with_zabbix_or_render, only: [:edit, :update, :sync_zabbix]
  before_action :set_zabbix, only: [:destroy]

  # user management
  # GET /users_admin
  def index
    page = params[:page] || 1

    @users = User.all.page(page).per(10)
  end

  # register new user only by master
  # GET /users_admin/new
  def new
    @user = User.new
  end

  # create new user only by master
  # POST /users_admin
  def create
    @user = User.new(
      email:                 params[:user][:email],
      password:              params[:user][:password],
      password_confirmation: params[:user][:password_confirmation],
      admin:                 params[:user][:admin],
      master:                params[:user][:master]
    )

    e = -> (ex) {
      flash[:alert] = ex.message
      redirect_to(action: :new)
    }

    begin
      @user.save!
    rescue => ex
      e.(ex) and return
    end

    begin
      #TODO カレントユーザーでZabbixとコネクションを張れるようにする
      s = AppSetting.get
      z = Zabbix.new(s.zabbix_user, s.zabbix_pass)
      user_id_z = z.create_user(@user.email, @user.encrypted_password)

      if @user.master && @user.admin
        z.update_user(user_id_z, type: Zabbix::UserTypeSuperAdmin)
      elsif @user.master
        z.update_user(user_id_z, usergroup_ids: [z.get_master_usergroup_id])
      end
    rescue => ex
      @user.destroy
      e.(ex) and return
    end

    flash[:notice] = I18n.t('users.msg.created')
    redirect_to(action: :index) and return
  end

  # GET /users_admin/1/edit
  def edit
    @user    = User.find( params.require(:id) )
    @clients = Client.all
    allowed_projects = @user.projects.includes(:client)
    @allowed_projects_title = allowed_projects.map do |project|
      client_name = project.client.name
      {project_id: project.id, title: "#{client_name} / #{project.name}[#{project.code}]"}
    end

    render partial: 'edit'
  end

  # PUT /users_admin/1
  def update
    user_id          = params.require(:id)
    allowed_projects = params[:allowed_projects]
    master           = params.require(:master) == 'true'
    admin            = params.require(:admin)  == 'true'
    password         = params[:password]
    password_confirm = params[:password_confirmation]

    user = User.find(user_id)
    if master
      user.projects = []
    else
      user.project_ids = allowed_projects
    end

    user.master = master
    user.admin = admin

    if password && password_confirm
      unless password == password_confirm
        render text: 'Password confirmation does not match Password', status: 500 and return
      end

      user.password = password
      user.password_confirmation = password_confirm
      set_password = true
    end

    unless user.save
      render text: user.errors.full_messages.join(' '), status: 500 and return
    end

    s = AppSetting.get
    z = Zabbix.new(s.zabbix_user, s.zabbix_pass)
    zabbix_user_id = z.get_user_id(user.email)

    if set_password
      z.update_user(zabbix_user_id, password: user.encrypted_password)
    end

    if user.master && user.admin
      z.update_user(zabbix_user_id, usergroup_ids: [z.get_default_usergroup_id], type: Zabbix::UserTypeSuperAdmin)
    elsif user.master
      z.update_user(zabbix_user_id, usergroup_ids: [z.get_master_usergroup_id])
    else
      hostgroup_names = user.projects.pluck(:code).map{|code| code + (user.admin? ? '-read-write' : '-read')}
      usergroup_ids = [z.get_default_usergroup_id]
      if hostgroup_names.present?
        usergroup_ids.concat(z.get_usergroup_ids(hostgroup_names))
      end
      z.update_user(zabbix_user_id, usergroup_ids: usergroup_ids)
    end
    render text: I18n.t('users.msg.updated')
  end

  # PUT /users_admin/sync_zabbix
  # 全てのユーザーをZabbixに登録する。
  def sync_zabbix
    s = AppSetting.get
    z = Zabbix.new(s.zabbix_user, s.zabbix_pass)

    users = User.all
    users.each do |user|
      next if z.user_exists?(user.email)

      # XXX: DRY. Same as create of this controller.
      user_id_z = z.create_user(user.email, user.encrypted_password)
      if user.master && user.admin
        z.update_user(user_id_z, type: Zabbix::UserTypeSuperAdmin)
      elsif user.master
        z.update_user(user_id_z, usergroup_ids: [z.get_master_usergroup_id])
      end
    end

    render text: I18n.t('users.msg.synced'); return
  end

  # delete acount
  # DELETE /users_admin/1
  def destroy
    @user = User.find(params.require(:id))

    # delete user from zabbix
    z = @zabbix
    begin
      z.delete_user(@user.email)
    rescue => ex
      flash[:alert] = "Zabbix 処理中にエラーが発生しました #{ex.message}"
      redirect_to(action: :index) and return
    end

    #delete user from SkyHopper
    @user.destroy

    flash[:notice] = I18n.t('users.msg.deleted')
    redirect_to(action: :index)
  end

  private

  def set_zabbix
    begin
      @zabbix = Zabbix.new(current_user.email, current_user.encrypted_password)
    rescue Zabbix::ConnectError => ex
      flash[:alert] = "Zabbix 処理中にエラーが発生しました。 #{ex.message}"
      redirect_to users_admin_index_path
    end
  end
end
