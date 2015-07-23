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

  # GET /snapshots
  def index
    infra     = Infrastructure.find(params.require(:infra_id))
    volume_id = params[:volume_id]
    ec2       = infra.ec2

    parameters = { owner_ids: ['self'] }
    parameters[:filters] = [{name: 'volume-id', values: [volume_id]}] if volume_id
    resp = ec2.describe_snapshots(parameters)

    render json: resp.to_h
  end

  # POST /snapshots
  def create
    volume_id   = params.require(:volume_id)
    physical_id = params.require(:physical_id)
    infra       = Infrastructure.find(params.require(:infra_id))
    # ec2         = infra.ec2

    # # 作成前に fsfreeze したい
    # resp = ec2.create_snapshot(volume_id: volume_id)
    # ec2.create_tags({resources: [resp.snapshot_id], tags: [{key: 'instance-id', value: physical_id}]})

    snapshot = Snapshot.create(infra, volume_id, physical_id)

    render text: 'Snapshot creation succeeded!'
  end

  # DELETE /snapshots/:snapshot_id
  def destroy
    infra_id    = params.require(:infra_id)
    snapshot_id = params.require(:snapshot_id)

    snapshot = Snapshot.new(infra, snapshot_id)
    snapshot.delete

    render nothing: true, status: 200
  end

  # POST /snapshots/schedule
  def schedule
    volume_id   = params.require(:volume_id)
    physical_id = params.require(:physical_id)
    infra_id    = params.require(:infra_id)
    schedule    = params.require(:schedule).permit(:enabled, :frequency, :day_of_week, :time)

    ss = SnapshotSchedule.find_by(volume_id: volume_id)
    ss.update_attributes!(schedule)

    if ss.enabled?
      PeriodicSnapshotJob.set(
        wait_until: ss.next_run
      ).perform_later(volume_id, infra_id, current_user.id)
    end

    render text: I18n.t('schedules.msg.updated'), status: 200 and return
  end

  def restore

  end
end
