class KeyPairsController < ApplicationController
  include Concerns::BeforeAuth
  # --------------- Auth
  before_action :authenticate_user!

  before_action do
    project_id = params[:id]
    @allow_change = current_user.admin? and allowed_project(project_id)
  end

  def index
    @project_id = params.require(:id)
    @project = Project.find(@project_id)
  end

  def delete_key_pair
    unless current_user.admin?
      render text: '', status: 403 and return
    end

    @project_id = params.require(:id)
    @region     = params.require(:region)
    @key_name   = params.require(:name)

    project = Project.find(@project_id)

    ec2 = Aws::EC2::Client.new(
      access_key_id:     project.access_key,
      secret_access_key: project.secret_access_key,
      region:            @region
    )
    ec2.delete_key_pair(key_name: @key_name)

    render text: '', status: 200 and return
  end
end
