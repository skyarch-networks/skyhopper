#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class SnapshotsController < ApplicationController
  before_action :authenticate_user!

  # before_action do
  #   authorize()
  # end


  def create
    volume_id = params.require(:volume_id)
    infra     = Infrastructure.find(params.require(:infra_id))
    project   = infra.project

    ec2 = Aws::EC2::Client.new(
      access_key_id:     project.access_key,
      secret_access_key: project.secret_access_key,
      region:            infra.region
    )
    render json: ec2.create_snapshot(volume_id: volume_id)
  end
end
