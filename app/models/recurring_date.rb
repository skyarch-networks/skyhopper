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
end
