#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

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
      render text: ex.message, status: 500 and return
    end

    render json: key
  end
end
