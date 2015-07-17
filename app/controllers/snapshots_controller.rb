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


  def index
    infra = Infrastructure.find(params.require(:infra_id))
    ec2   = infra.ec2

    resp = ec2.describe_snapshots({owner_ids: ['self']})

    render json: resp.to_h
  end

  def create
    volume_id   = params.require(:volume_id)
    physical_id = params.require(:physical_id)
    infra       = Infrastructure.find(params.require(:infra_id))
    ec2         = infra.ec2

    resp = ec2.create_snapshot(volume_id: volume_id)
    ec2.create_tags({resources: [resp.snapshot_id], tags: [{key: 'instance-id', value: physical_id}]})

    render text: 'Snapshot creation succeeded!'
  end

  def destroy

  end

  def restore

  end
end
