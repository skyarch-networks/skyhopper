class KeyPairsController < ApplicationController
  # --------------- Auth
  before_action :authenticate_user!

  def index
    @project_id = params.require(:id)

    @project = Project.find(@project_id)
  end

  def delete

  end
end
