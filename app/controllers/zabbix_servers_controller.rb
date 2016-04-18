class ZabbixServersController < ApplicationController
  before_action :set_zabbix_server, only: [:show, :edit, :update, :destroy]

  # GET /zabbix_servers
  # GET /zabbix_servers.json
  def index
    @zabbix_servers = ZabbixServer.all
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
    @zabbix_server = ZabbixServer.new(zabbix_server_params)

    respond_to do |format|
      if @zabbix_server.save
        format.html { redirect_to @zabbix_server, notice: 'Zabbix server was successfully created.' }
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
        format.html { redirect_to @zabbix_server, notice: 'Zabbix server was successfully updated.' }
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
    @zabbix_server.destroy
    respond_to do |format|
      format.html { redirect_to zabbix_servers_url, notice: 'Zabbix server was successfully destroyed.' }
      format.json { head :no_content }
    end
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
end
