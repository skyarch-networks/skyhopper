#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
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
    parameters = JSON.parse(params.require(:parameters), symbolize_names: true)

    # Update すべきな parameters
    update_parameters = parameters.select{|p| p[:changed] && p[:id]}
    update_parameters.each do |p|
      param_db = @project.project_parameters.find(p[:id])
      param_db.update!(p.slice(:key, :value))
    end

    # Destroy すべきな parameters
    destroy_parameters = @project.project_parameter_ids - parameters.map{|p|p[:id]}.compact
    ProjectParameter.where(id: destroy_parameters).delete_all

    # Create すべきな parameters
    create_parameters = parameters.select{|p| p[:id].nil?}
    ProjectParameter.import create_parameters.map{|p| ProjectParameter.new(key: p[:key], value: p[:value], project: @project)}

    # TODO: I18n
    render text: I18n.t('project_parameters.msg.updated')
  end

  private

  def set_project
    @project = Project.find(params.require(:project_id))
  end
end
