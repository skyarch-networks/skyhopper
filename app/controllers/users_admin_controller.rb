#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class UsersAdminController < ApplicationController
  include Concerns::InfraLogger

  before_action :authenticate_user!
  before_action do
    authorize User.new
  end

  before_action :with_zabbix, only: %i[new create destroy edit update sync_zabbix]

  # user management
  # GET /users_admin
  def index
    page = params[:page] || 1

    @users = User.all.page(page)
    respond_to do |format|
      format.json
      format.html
    end
  end

  # register new user only by master
  # GET /users_admin/new
  def new
    @user = User.new(session[:form])
    session[:form] = nil # remove temporary form data

    @zabbix_servers = ZabbixServer.all
  end

  # create new user only by master
  # POST /users_admin
  def create
    @user = User.new(
      email: params[:user][:email],
      password: params[:user][:password],
      password_confirmation: params[:user][:password_confirmation],
      admin: params[:user][:admin],
      master: params[:user][:master],
    )

    e = lambda { |ex|
      flash[:alert] = ex.message
      session[:form] = {
        email: params[:user][:email],
        admin: params[:user][:admin],
        master: params[:user][:master],
      }
      redirect_to(action: :new)
    }

    begin
      @user.save!
    rescue StandardError => ex
      e.call(ex) and return
    end

    begin
      # TODO カレントユーザーでZabbixとコネクションを張れるようにする
      z_params = params[:user][:zabbix_servers]
      z_params.shift
      @user.zabbix_server_ids = z_params
      zab = ZabbixServer.find(z_params)
      zab.each do |s|
        z = Zabbix.new(s.fqdn, s.username, s.password)
        z.create_user(@user)
      end
    rescue StandardError => ex
      @user.destroy
      e.call(ex) and return
    end

    flash[:notice] = I18n.t('users.msg.created')
    redirect_to(action: :index) and return
  end

  # GET /users_admin/1/edit
  def edit
    user = User.find(params.require(:id))
    @user = user.trim_password
    @clients = Client.all.map { |c| { value: c.id, text: c.name } }
    @allowed_projects = user.projects.includes(:client).map do |project|
      client_name = project.client.name
      { value: project.id, text: "#{client_name}/#{project.name}[#{project.code}]" }
    end
    @allowed_zabbix = user.zabbix_servers.map do |zabbix|
      { value: zabbix.id, text: zabbix.fqdn }
    end

    @mfa_key, @mfa_qrcode = user.new_mfa_key
  end

  # PUT /users_admin/1
  def update
    body = JSON.parse(params.require(:body), symbolize_names: true)
    user_id          = params.require(:id)
    allowed_projects = body[:allowed_projects]
    master           = body[:master]
    admin            = body[:admin]
    mfa_secret_key   = body[:mfa_secret_key]
    remove_mfa_key   = body[:remove_mfa_key]
    password         = body[:password]
    password_confirm = body[:password_confirmation]
    allowed_zabbix   = body[:allowed_zabbix]

    user = User.find(user_id)
    if master
      user.projects = []
    else
      user.project_ids = allowed_projects
    end

    user.master = master
    user.admin = admin

    if password && password_confirm
      user.password = password
      user.password_confirmation = password_confirm
      set_password = true
    end

    user.zabbix_server_ids = allowed_zabbix
    user.mfa_secret_key = mfa_secret_key if mfa_secret_key
    user.mfa_secret_key = nil            if remove_mfa_key

    user.save!

    # Zabbix update create user.
    servers = ZabbixServer.all
    begin
      servers.each do |s|
        z = Zabbix.new(s.fqdn, s.username, s.password)
        if allowed_zabbix.include? s.id
          update_user_zabbix(z, user, set_password)
        elsif z.user_exists?(user.email)
          z.delete_user(user.email)
        end
      end
    rescue StandardError => ex
      flash[:alert] = I18n.t('users.msg.error', msg: ex.message)
      raise
    end

    render plain: I18n.t('users.msg.updated')
  end

  # PUT /users_admin/sync_zabbix
  # 全てのユーザーをZabbixに登録する。
  def sync_zabbix
    servers = ZabbixServer.all
    servers.each do |s|
      z = Zabbix.new(s.fqdn, s.username, s.password)
      add_create_user(z)
    end

    render plain: I18n.t('users.msg.synced')
    nil
  end

  # delete acount
  # DELETE /users_admin/1
  def destroy
    @user = User.find(params.require(:id))

    if @user == current_user
      flash[:alert] = t('users.msg.cannot_delete_yourself')
      raise 'Cannot delete yourself'
    end

    # delete user from zabbix
    begin
      @user.zabbix_servers.each do |s|
        z = Zabbix.new(s.fqdn, current_user.email, current_user.encrypted_password)
        z.delete_user(@user.email)
      end
    rescue StandardError => ex
      flash[:alert] = I18n.t('users.msg.error', msg: ex.message)
      raise
    end

    # delete user from SkyHopper
    @user.destroy

    flash[:notice] = t('users.msg.deleted', name: @user.email)
    redirect_to(action: :index)
  end

  private

  def set_zabbix(fqdn)
    @zabbix = Zabbix.new(fqdn, current_user.email, current_user.encrypted_password)
  rescue StandardError => ex
    flash[:alert] = I18n.t('users.msg.error', msg: ex.message)
    redirect_to users_admin_index_path
  end

  def add_create_user(zabbix)
    users = User.all
    users.each do |user|
      next if zabbix.user_exists?(user.email)

      zabbix.create_user(user)
    end
  end

  def update_user_zabbix(zabbix, user, set_password)
    zabbix.create_user(user) unless zabbix.user_exists?(user.email)
    zabbix_user_id = zabbix.get_user_id(user.email)

    if set_password
      zabbix.update_user(zabbix_user_id, password: user.encrypted_password)
    end

    usergroup_ids = [zabbix.get_group_id_by_user(user)]
    if user.master
      zabbix.update_user(zabbix_user_id, usergroup_ids: usergroup_ids, type: zabbix.get_user_type_by_user(user))
    else
      hostgroup_names = user.projects.pluck(:code).map { |code| code + (user.admin? ? '-read-write' : '-read') }
      if hostgroup_names.present?
        usergroup_ids.concat(zabbix.get_usergroup_ids(hostgroup_names))
      end
      zabbix.update_user(zabbix_user_id, usergroup_ids: usergroup_ids)
    end
  end
end
