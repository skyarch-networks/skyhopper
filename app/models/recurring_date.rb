#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class RecurringDate < ActiveRecord::Base
  belongs_to :operation_duration
  enum repeats: ['', :everyday, :weekdays, :weekends, :other]
  serialize :dates, JSON

  def start_time
    attributes['start_time'].strftime("%H:%M")
  end

  def end_time
    attributes['end_time'].strftime("%H:%M")
  end
end
