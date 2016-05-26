class ZabbixServersController < ApplicationController
  include Concerns::InfraLogger
  # ------------- Auth
  before_action :authenticate_user!
  before_action :set_zabbix_server, only: [:show, :edit, :update, :destroy]
  before_action :auth_zabbix_server, only: [:create]

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
    @zabbix_server = ZabbixServer.new(@zabbix_server_params)

    respond_to do |format|
      if @zabbix_server.save
        format.html { redirect_to zabbix_servers_url, notice: I18n.t('zabbix_servers.msg.created') }
        format.json { render :show, status: :created, location: @zabbix_server }
      else
        format.html { render :new }
        format.json { render json: @zabbix_server.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /zabbix_servers/1
  # PATCH/PUT /zabbix_servers/1.json
  def update
    respond_to do |format|
      if @zabbix_server.update(zabbix_server_params)
        format.html { redirect_to zabbix_servers_url, notice: I18n.t('zabbix_servers.msg.updated') }
        format.json { render :show, status: :ok, location: @zabbix_server }
      else
        format.html { render :edit }
        format.json { render json: @zabbix_server.errors, status: :unprocessable_entity }
      end
    end
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
      params.require(:zabbix_server).permit(:fqdn, :username, :password, :version, :details)
    end

    def auth_zabbix_server
      params = zabbix_server_params
      begin
        z = Zabbix.new(params[:fqdn], params[:username], params[:password])
        params[:version] = z.version
      rescue => ex
        raise ex
      end
      @zabbix_server_params = params

    end

end
