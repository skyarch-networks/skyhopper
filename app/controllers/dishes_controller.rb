#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# TODO: Rails.logger
class DishesController < ApplicationController
  include DishesController::Validate

  # --------------- Auth
  before_action :authenticate_user!

  before_action :set_dish, only: %i[show edit update destroy]

  before_action do
    project_id = params[:project_id] || (begin
                                           params[:dish][:project_id]
                                         rescue StandardError
                                           nil
                                         end)
    authorize(@dish || Dish.new(project_id: project_id))
  end

  # GET /dishes
  def index
    @project_id = params[:project_id]
    page        = params[:page] || 1

    @project_name = Project.find(@project_id).name if @project_id
    @dishes = Dish.where(project_id: @project_id).page(page)

    respond_to do |format|
      format.json
      format.html
    end
  end

  # GET /dishes/1
  def show
    @selected_serverspecs = @dish.servertests
    @selected_playbook_roles = @dish.selected_playbook_roles

    render partial: 'show'
  end

  # GET /dishes/1/edit
  def edit
    @global_serverspecs = Servertest.global

    @selected_serverspecs = @dish.servertests

    render partial: 'edit'
  end

  # PUT /dishes/1
  def update
    servertest_ids = params[:serverspecs] || []

    # TODO error handling
    @dish.update(
      servertest_ids: servertest_ids,
      status: nil,
    )

    render text: I18n.t('dishes.msg.updated')
  end

  # GET /dishes/new
  def new
    project_id = params[:project_id]

    @dish = Dish.new(project_id: project_id)
  end

  # POST /dishes
  def create
    # TODO: error 処理
    dish = Dish.new(dish_params.merge(runlist: []))
    project_id = params[:dish][:project_id]

    if dish.save
      redirect_to dishes_path(project_id: project_id),
                  notice: I18n.t('dishes.msg.created')
    else
      # TODO: show error message
      redirect_to new_dish_path(project_id: project_id)
    end
  end

  # DELETE /dishes/1
  def destroy
    project_id = @dish.project_id
    @dish.destroy

    redirect_to dishes_path(project_id: project_id), notice: I18n.t('dishes.msg.deleted')
  end

  private

  def dish_params
    params.require(:dish).permit(:name, :project_id, :detail)
  end

  def set_dish
    @dish = Dish.find(params.require(:id))
  end
end
