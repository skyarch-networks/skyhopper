#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class SnapshotsController < ApplicationController
  include Concerns::InfraLogger

  before_action :authenticate_user!

  before_action do
    set_infra
    def @infra.policy_class; SnapshotPolicy; end
    authorize(@infra)
  end

  # GET /snapshots
  def index
    volume_id = params[:volume_id]
    ec2       = @infra.ec2

    parameters = { owner_ids: ['self'] }
    parameters[:filters] = [{name: 'volume-id', values: [volume_id]}] if volume_id
    resp = ec2.describe_snapshots(parameters)

    snapshots = resp.snapshots.map { |snapshot|
      tags_hash = snapshot.tags.map { |tag| [tag.key, tag.value] }.to_h
      snapshot.tags = tags_hash
      snapshot
    }

    render json: {snapshots: snapshots}
  end

  # POST /snapshots
  def create
    volume_id   = params.require(:volume_id)
    physical_id = params.require(:physical_id)

    # 作成前に fsfreeze したい
    snapshot = Snapshot.create(@infra, volume_id, physical_id)
    infra_logger_success("Snapshot creation for #{volume_id} has started.\n Snapshot ID: #{snapshot.snapshot_id}")

    notify_progress(Snapshot.new(@infra, snapshot.snapshot_id))

    render json: snapshot.data
  end

  # DELETE /snapshots/:snapshot_id
  def destroy
    snapshot_id = params.require(:snapshot_id)

    snapshot = Snapshot.new(@infra, snapshot_id)
    snapshot.delete

    render nothing: true, status: 200
  end

  # POST /snapshots/schedule
  def schedule
    volume_id   = params.require(:volume_id)
    physical_id = params.require(:physical_id)
    schedule    = params.require(:schedule).permit(:enabled, :frequency, :day_of_week, :time)

    ss = SnapshotSchedule.find_or_create_by(volume_id: volume_id)
    ss.update_attributes!(schedule)

    if ss.enabled?
      PeriodicSnapshotJob.set(
        wait_until: ss.next_run
      ).perform_later(volume_id, physical_id, @infra, current_user.id)
    end

    render text: I18n.t('schedules.msg.snapshot_updated'), status: 200 and return
  end

  # def restore

  # end

  private

  def notify_progress(snapshot)
    Thread.new do
      sleep(2)
      begin
        15.times do
          break if snapshot.latest_status == 'completed'
          sleep(15)
        end
      rescue => ex
        infra_logger_fail("Snapshot creation for #{snapshot.volume_id} has failed.\n #{ex.class}: #{ex.message.inspect} \n" + ex.backtrace.join("\n"))
        raise ex
      end

      infra_logger_success("Snapshot creation for #{snapshot.volume_id} has completed.\n Snapshot ID: #{snapshot.snapshot_id}")
      ws = WSConnector.new('snapshot_status', snapshot.snapshot_id)
      ws.push('completed')
    end
  end

  def set_infra
    @infra = Infrastructure.find(params.require(:infra_id))
  end
end
