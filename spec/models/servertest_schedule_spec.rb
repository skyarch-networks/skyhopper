#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

RSpec.describe ServertestSchedule, type: :model do
  let(:schedule) { build_stubbed(:serverspec_schedule) }

  describe "#next_run" do
    it 'should return future time' do
      expect(schedule.next_run).to be >= Time.current
    end

    it 'should be same o\'clock' do
      expect(schedule.next_run.hour).to eq schedule.time
    end

    it 'should be same day of week' do
      expect(schedule.next_run.wday).to eq schedule[:day_of_week]
    end
  end
end
