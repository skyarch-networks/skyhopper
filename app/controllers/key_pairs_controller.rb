class KeyPairsController < ApplicationController
  include Concerns::InfraLogger
  # --------------- Auth
  before_action :authenticate_user!

  before_action do
    @project_id = params.require(:project_id)
  end

  # GET /key_pairs
  def index
    @project = Project.find(@project_id)
    @allow_change = current_user.admin? and current_user.allow?(@project)
  end

  # GET /key_pairs/retrieve
  def retrieve
    @regions   = AWS::Regions
    @key_pairs = KeyPair.all(@project_id)
  end

  # DELETE /key_pairs/:name
  def destroy
    unless current_user.admin?
      ws_send(t('common.msg.no_permission'), false)
      render nothing: true, status: 403 and return
    end

    @region     = params.require(:region)
    @key_name   = params.require(:name)

    project = Project.find(@project_id)

    ec2 = Aws::EC2::Client.new(
      access_key_id:     project.access_key,
      secret_access_key: project.secret_access_key,
      region:            @region
    )
    ec2.delete_key_pair(key_name: @key_name)

    ws_send(t('key_pairs.msg.deleted', name: @key_name), true)
    render nothing: true, status: 200 and return
  end
end
