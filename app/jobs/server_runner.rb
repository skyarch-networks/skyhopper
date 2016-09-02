#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerRunner
  include Sidekiq::Worker
  include Sidetiq::Schedulable

  recurrence { minutely(5) }

  def perform
    ServerStateWorker.perform_now
  end
end
