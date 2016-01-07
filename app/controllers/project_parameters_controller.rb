#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ProjectParametersController < ApplicationController

  # ------------- Auth
  before_action :authenticate_user!

  before_action :set_project, only: [:show]
  # TODO: authorize
  # before_action do
  #   authorize(@project)
  # end

  def show
    @parameters = @project.project_parameters
  end

  private

  def set_project
    @project = Project.find(params.require(:project_id))
  end
end
