#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class InfrastructureLogsController < ApplicationController
  before_action :authenticate_user!

  def index
    page = params[:page] || 1
    page = page.to_i

    infrastructure_logs = get_infrastructure_logs.order(sort_key + ' ' + order)
    @logs = infrastructure_logs.page(page).per(20)
    @max = (infrastructure_logs.size / 20.0).ceil
    @current = page
  end

  # GET /infrastructure_logs/download_all
  def download_all
    infrastructure_logs = get_infrastructure_logs
    now_text = Time.zone.now.strftime('%Y%m%d%H%M%S')
    filename = "infrastrucure_logs-#{now_text}.zip"
    infrastructure_logs.export_as_zip do |zipfile|
      send_file(zipfile.path, filename: filename)
    end
  end

  # GET /infrastructure_logs/:id/download
  def download
    id = params[:id]
    infrastructure_log = InfrastructureLog.find(id)
    authorize infrastructure_log
    send_data(infrastructure_log.to_text, filename: infrastructure_log.to_filename)
  end

  private

  def get_infrastructure_logs
    infra_id = params.require(:infrastructure_id)
    infrastructure_logs = InfrastructureLog.for_infra(infra_id)
    infrastructure_logs.find_each do |infrastructure_log|
      authorize infrastructure_log
    end
    infrastructure_logs
  end

  def sort_key
    allow_sort_keys = %w[users.email infrastructure_logs.status infrastructure_logs.details infrastructure_logs.created_at]
    allow_sort_keys.include?(params[:sort_key]) ? params[:sort_key] : 'infrastructure_logs.created_at'
  end

  def order
    if params[:sort_key].nil? && params[:order].nil?
      return 'DESC'
    end

    params[:order].to_i >= 0 ? 'ASC' : 'DESC'
  end
end
