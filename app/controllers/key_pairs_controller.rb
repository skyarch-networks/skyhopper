class KeyPairsController < ApplicationController
  include Concerns::InfraLogger
  # --------------- Auth
  before_action :authenticate_user!

  before_action do
    @project_id = params.require(:project_id)
  end

  before_action do
    project = Project.find(@project_id)
    def project.policy_class; KeyPairPolicy; end
    authorize(project)
  end

  # GET /key_pairs
  def index
    @project = Project.find(@project_id)
    @allow_change = KeyPairPolicy.new(current_user, @project).destroy?
  end

  # GET /key_pairs/retrieve
  def retrieve
    @regions   = AWS::Regions
    @key_pairs = KeyPair.all(@project_id)
  end

  # DELETE /key_pairs/:name
  def destroy
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
