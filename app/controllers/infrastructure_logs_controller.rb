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

    infrastructure_logs = InfrastructureLog.for_infra(infra_id)
    @logs = infrastructure_logs.page(page).per(20)
    @max = (infrastructure_logs.size / 20.0).ceil
    @current = page
  end
end
