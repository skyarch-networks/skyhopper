class ZabbixServersController < ApplicationController
  include Concerns::InfraLogger
  # ------------- Auth
  before_action :authenticate_user!
  before_action :set_zabbix_server, only: %i[show edit update destroy]

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
  def show; end

  # GET /zabbix_servers/new
  def new
    @zabbix_server = ZabbixServer.new
  end

  # GET /zabbix_servers/1/edit
  def edit
    respond_to do |format|
      format.json
      format.html
    end
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
        ws.push_as_json({ status: true, message: I18n.t('zabbix_servers.msg.created'), url: zabbix_servers_url })
      rescue StandardError => ex
        ws.push_as_json({ status: false, message: ex.message })
        render status: :not_found and return
      end
    end

    render body: nil, status: :ok and return
  end

  # PATCH/PUT /zabbix_servers/1
  # PATCH/PUT /zabbix_servers/1.json
  def update
    params = zabbix_server_params
    begin
      Zabbix.new(params[:fqdn], params[:username], params[:password])
      @zabbix_server.update(params)
    rescue StandardError => ex
      render plain: ex.message, status: :internal_server_error and return
    end

    render plain: I18n.t('zabbix_servers.msg.updated') and return
  end

  # DELETE /zabbix_servers/1
  # DELETE /zabbix_servers/1.json
  def destroy
    go = -> { redirect_to zabbix_servers_url }
    begin
      @zabbix_server.destroy!
    rescue StandardError => ex
      flash[:alert] = ex.message
      go.call and return
    end

    ws_send(t('zabbix_servers.msg.deleted', name: @zabbix_server.fqdn), true)
    go.call and return
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
