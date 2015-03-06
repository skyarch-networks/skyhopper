#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

#TODO: Rails.logger
class DishesController < ApplicationController
  include Concerns::BeforeAuth
  include DishesController::Validate

  # --------------- Auth
  before_action :authenticate_user!

  before_action except: [:index, :show] do
    if project_id = have_project?
      allowed_project(project_id)
    else
      master and admin
    end
  end

  before_action only: [:index, :show] do
    if project_id = have_project?
      allowed_project(project_id)
    end
  end

  # GET /dishes
  def index
    @project_id = params[:project_id]
    page        = params[:page] || 1

    @project_name = Project.find(@project_id).name if @project_id
    @dishes = Dish.where(project_id: @project_id).page(page).per(10)
  end

  # GET /dishes/1
  def show
    @dish = Dish.find(params.require(:id))
    @selected_serverspecs = @dish.serverspecs
    @runlist = @dish.runlist

    render partial: 'show'
  end

  # GET /dishes/1/edit
  def edit
    id = params.require(:id)
    dish = Dish.find(id)

    @global_serverspecs = Serverspec.global

    @cookbooks = ChefAPI.index(:cookbook).keys
    @roles     = ChefAPI.index(:role).map(&:name)

    @runlist = dish.runlist
    @selected_serverspecs = dish.serverspecs

    render partial: 'edit'
  end

  # PUT /dishes/1
  def update
    dish_id = params.require(:id)
    runlist = params[:runlist] || []
    serverspec_ids = params[:serverspecs] || []

    dish = Dish.find(dish_id)

    # TODO error handling
    dish.update(
      runlist:     runlist,
      serverspec_ids: serverspec_ids,
      status:      nil
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
    id = params.require(:id)
    dish = Dish.find(id)
    project_id = dish.project_id
    dish.destroy

    redirect_to dishes_path(project_id: project_id), notice: I18n.t('dishes.msg.deleted')
  end

  # GET /dishes/1/runlist.json
  def runlist
    id   = params.require(:id)
    dish = Dish.find(id)

    @runlist = dish.runlist
  end

  private

  def dish_params
    params.require(:dish).permit(:name, :project_id, :detail)
  end

  # Projectに紐付いたDishを扱っているか返す。
  # 紐付いていればproject_id, 紐付いていなければ nil を返す。
  def have_project?
    begin
      return params[:project_id] || Dish.find(params[:id]).project_id || params[:dish][:id]
    rescue
      return nil
    end
  end
end
