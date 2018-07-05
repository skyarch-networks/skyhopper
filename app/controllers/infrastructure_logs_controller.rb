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
    infra_id = params.require(:infrastructure_id)
    page = params[:page] || 1
    page = page.to_i

    infrastructure_logs = InfrastructureLog.for_infra(infra_id).order(sort_key + ' ' + order)
    @logs = infrastructure_logs.page(page).per(20)
    @max = (infrastructure_logs.size / 20.0).ceil
    @current = page
  end

  private

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
