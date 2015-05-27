#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class PeriodicServerspecJob < ActiveJob::Base
  queue_as :default
  include Sidekiq::Worker

  def perform(physical_id, infra_id, user_id)
    schedule = ServerspecSchedule.find_by(physical_id: physical_id)

    PeriodicServerspecJob.set(
      wait_until: schedule.next_run
    ).perform_later(physical_id, infra_id, user_id)

    ServerspecJob.perform_now(physical_id, infra_id, user_id)
  end
end
