#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
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

  before_action :with_zabbix, only: [:new, :create, :destroy, :edit, :update, :sync_zabbix]
  before_action :set_zabbix, only: [:destroy]

  # user management
  # GET /users_admin
  def index
    page = params[:page] || 1

    @users = User.all.page(page)
    respond_to do |format|
      format.json {@users}
      format.html
    end
  end

  # register new user only by master
  # GET /users_admin/new
  def new
    @user = User.new(session[:form])
    session[:form] = nil  # remove temporary form data
  end

  # create new user only by master
  # POST /users_admin
  def create
    @user = User.new(
      email:                 params[:user][:email],
      password:              params[:user][:password],
      password_confirmation: params[:user][:password_confirmation],
      admin:                 params[:user][:admin],
      master:                params[:user][:master],
    )

    e = -> (ex) {
      flash[:alert] = ex.message
      session[:form] = {
        email:  params[:user][:email],
        admin:  params[:user][:admin],
        master: params[:user][:master],
      }
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
      z.create_user(@user)
    rescue => ex
      @user.destroy
      e.(ex) and return
    end

    flash[:notice] = I18n.t('users.msg.created')
    redirect_to(action: :index) and return
  end

  # GET /users_admin/1/edit
  def edit
    user = User.find(params.require(:id))
    @user = user.trim_password
    @clients = Client.all.map{|c|{value: c.id, text: c.name}}
    allowed_projects = user.projects.includes(:client)
    @allowed_projects = allowed_projects.map do |project|
      client_name = project.client.name
      {value: project.id, text: "#{client_name}/#{project.name}[#{project.code}]"}
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


    user.mfa_secret_key = mfa_secret_key if mfa_secret_key
    user.mfa_secret_key = nil            if remove_mfa_key

    user.save!

    s = AppSetting.get
    z = Zabbix.new(s.zabbix_user, s.zabbix_pass)
    zabbix_user_id = z.get_user_id(user.email)

    z.create_user(user) unless z.user_exists?(user.email)

    if set_password
      z.update_user(zabbix_user_id, password: user.encrypted_password)
    end

    usergroup_ids = [z.get_group_id_by_user(user)]
    if user.master
      z.update_user(zabbix_user_id, usergroup_ids: usergroup_ids, type: z.get_user_type_by_user(user))
    else
      hostgroup_names = user.projects.pluck(:code).map{|code| code + (user.admin? ? '-read-write' : '-read')}
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

      z.create_user(user)
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
    rescue => ex
      flash[:alert] = "Zabbix 処理中にエラーが発生しました。 #{ex.message}"
      redirect_to users_admin_index_path
    end
  end
end
