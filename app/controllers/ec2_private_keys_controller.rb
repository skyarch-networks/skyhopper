class Ec2PrivateKeysController < ApplicationController
  before_action :authenticate_user!

  # POST /ec2_private_keys
  # AWS に KeyPair を新たに作成する。DBには保存しない。
  def create
    project_id = params.require(:project_id)
    region     = params.require(:region)
    name       = params.require(:name)

    begin
      key = Ec2PrivateKey.new_from_aws(name, project_id, region)
    rescue => ex
      render text: ex.message
    end

    render json: key
  end
end
