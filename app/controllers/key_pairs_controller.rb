class KeyPairsController < ApplicationController
  # --------------- Auth
  before_action :authenticate_user!

  def index
    @project_id = params.require(:id)

    @project = Project.find(@project_id)
  end

  def delete_key_pair
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
