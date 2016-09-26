#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ServerRunner
  include Sidekiq::Worker

  def perform
    if AppSetting.set?
      ServerStateWorker.perform_now
    end
  end

end
