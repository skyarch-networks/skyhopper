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

  before_action :set_project, only: [:show, :update]
  # TODO: authorize
  # before_action do
  #   authorize(@project)
  # end

  def show
    @parameters = @project.project_parameters
  end

  # Create / Update / Destroy 全部やる
  # PUT /project_parameters
  def update
    # destroy されていない parameter の配列
    parameters = JSON.parse(params.require(:params), symbolize_names: true)

    # Update すべきな parameters
    update_parameters = parameters.select{|x| x[:changed] && x[:id]}
    # TODO: Update

    # TODO: Destroy すべきな parameters

    # Create すべきな parameters
    create_parameters = parameters.select{|x| x[:id].nil?}
    Rails.logger.info create_parameters
    ProjectParameter.import create_parameters.map{|p| ProjectParameter.new(key: p[:key], value: p[:value], project: @project)}

    # TODO: I18n
    render text: 'Updated success'
  end

  private

  def set_project
    @project = Project.find(params.require(:project_id))
  end
end
