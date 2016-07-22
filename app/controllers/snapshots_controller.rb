#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
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

    snapshots = Snapshot.describe(@infra, volume_id)
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
    infra_logger_success("Snapshot #{snapshot.snapshot_id} has been deleted.")

    render nothing: true, status: 200
  rescue Snapshot::VolumeProtectedError
    render text: I18n.t('snapshots.msg.snapshot_is_protected', snapshot_id: snapshot_id), status: 403 and return
  end

  # POST /snapshots/schedule
  def schedule
    volume_id   = params.require(:volume_id)
    physical_id = params.require(:physical_id)
    schedule    = params.require(:schedule).permit(:enabled, :frequency, :day_of_week, :time)

    ss = SnapshotSchedule.find_or_create_by(volume_id: volume_id)
    ss.update_attributes!(schedule)

    if ss.enabled?
      SnapshotJob.set(
        wait_until: ss.next_run
      ).perform_later(volume_id, physical_id, @infra, current_user.id)
    end

    render text: I18n.t('schedules.msg.snapshot_updated'), status: 200 and return
  end

  # def restore

  # end

  def save_retention_policy
    enabled   = params.require(:enabled)
    volume_id = params.require(:volume_id)

    if enabled == 'true'
      max_amount = params.require(:max_amount)
      policy = RetentionPolicy.find_or_create_by(resource_id: volume_id)
      policy.max_amount = max_amount
      policy.save!
    else
      policy = RetentionPolicy.find_by(resource_id: volume_id)
      policy.try!(:destroy)
    end

    render text: t('snapshots.msg.policy_saved'), status: 200 and return
  end


  private

  def notify_progress(snapshot)
    Thread.new do
      ws = WSConnector.new('snapshot_status', snapshot.snapshot_id)
      sleep(2)
      begin
        until snapshot.latest_status == 'completed'
          sleep(15)
        end
      rescue => ex
        infra_logger_fail("Snapshot creation for #{snapshot.volume_id} has failed.\n #{ex.class}: #{ex.message.inspect} \n" + ex.backtrace.join("\n"))
        ws.push(ex.message)
        raise ex
      end

      infra_logger_success("Snapshot creation for #{snapshot.volume_id} has completed.\n Snapshot ID: #{snapshot.snapshot_id}")
      ws.push('completed')

      DeleteOutdatedSnapshotsJob.perform_later(snapshot.volume_id, @infra)
    end
  end

  def set_infra
    @infra = Infrastructure.find(params.require(:infra_id))
  end
end
