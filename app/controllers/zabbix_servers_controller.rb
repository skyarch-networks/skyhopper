class ZabbixServersController < ApplicationController
  include Concerns::InfraLogger
  # ------------- Auth
  before_action :authenticate_user!
  before_action :set_zabbix_server, only: [:show, :edit, :update, :destroy]

  # GET /zabbix_servers
  # GET /zabbix_servers.json
  def index
    @zabbix_servers = ZabbixServer.all

    respond_to do |format|
      format.json
      format.html
    end
  end

  # GET /zabbix_servers/1
  # GET /zabbix_servers/1.json
  def show
  end

  # GET /zabbix_servers/new
  def new
    @zabbix_server = ZabbixServer.new
  end

  # GET /zabbix_servers/1/edit
  def edit
  end

  # POST /zabbix_servers
  # POST /zabbix_servers.json
  def create
    lang = params[:lang]
    params = zabbix_server_params
    ws = WSConnector.new('notifications', current_user.ws_key)
    Thread.new_with_db do
      if lang
        I18n.locale = lang
      end
      begin
        z = Zabbix.new(params[:fqdn], params[:username], params[:password])
        params[:version] = z.version
        @zabbix_server = ZabbixServer.new(params)
        @zabbix_server.save!
        ws.push_as_json({status: true, message: I18n.t('zabbix_servers.msg.created'), url: zabbix_servers_url})
      rescue => ex
        ws.push_as_json({status: false, message: ex.message})
      end
    end

      render nothing: true, status: 200 and return
  end

  # PATCH/PUT /zabbix_servers/1
  # PATCH/PUT /zabbix_servers/1.json
  def update
    params = zabbix_server_params
    begin
      Zabbix.new(params[:fqdn], params[:username], params[:password])
      @zabbix_server.update(params)
    rescue => ex
      render text: ex.message, status: 500 and return
    end

    render text: I18n.t('zabbix_servers.msg.updated') and return

  end

  # DELETE /zabbix_servers/1
  # DELETE /zabbix_servers/1.json
  def destroy
    go = -> () { redirect_to zabbix_servers_url }
    begin
      @zabbix_server.destroy!
    rescue => ex
      flash[:alert] = ex.message
      go.() and return
    end

    ws_send(t('zabbix_servers.msg.deleted', name: @zabbix_server.fqdn), true)
    go.() and return
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_zabbix_server
    @zabbix_server = ZabbixServer.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def zabbix_server_params
    params.require(:zabbix_server).permit(:fqdn, :username, :password, :details)
  end

end
