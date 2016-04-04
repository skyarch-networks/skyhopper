#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ClientsController < ApplicationController

  # ------------ Auth
  before_action :authenticate_user!

  # --------------- existence check
  before_action :client_exist, only: [:edit, :update, :destroy]

  before_action :set_client, only: [:edit, :update, :destroy]

  before_action do
    authorize(@client || Client.new)
  end

  before_action :with_zabbix, only: :destroy



  # GET /clients
  # GET /clients.json
  def index
    page = params[:page] || 1
    @clients = Client.page(page)
    respond_to do |format|
      format.json
      format.html
    end
  end

  # GET /clients/new
  def new
    @client = Client.new
  end

  # GET /clients/1/edit
  def edit
  end

  # POST /clients
  # POST /clients.json
  def create
    @client = Client.new(client_params)

    if @client.save
      redirect_to clients_path, notice: I18n.t('clients.msg.created')
    else
      flash[:alert] = @client.errors
      render action: 'new'
    end
  end

  # PATCH/PUT /clients/1
  # PATCH/PUT /clients/1.json
  def update
    if @client.update(client_params)
      redirect_to clients_path, notice: I18n.t('clients.msg.updated')
    else
      render action: 'edit'
    end
  end

  # DELETE /clients/1
  # DELETE /clients/1.json
  def destroy
    go = -> () { redirect_to clients_path }
    begin
      @client.destroy!
    rescue => ex
      flash[:alert] = ex.message
      go.() and return
    end

    flash[:notice] = I18n.t('clients.msg.deleted')
    go.() and return
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_client
    @client = Client.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def client_params
    params.require(:client).permit(:code, :name)
  end

  def client_exist
    return if params[:id].blank?

    unless Client.exists?(id: params[:id])
      redirect_to clients_path, alert: "Client \##{params[:id]} does not exist."
    end
  end
end
