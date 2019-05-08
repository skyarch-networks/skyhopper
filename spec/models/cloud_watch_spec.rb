#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

RSpec.describe CloudWatch, type: :model do
  let(:cw_client) { double('CloudWatch Client') }
  before do
    cw = double('cw', client: cw_client)
    str = kind_of(String)
    allow(AWS::CloudWatch).to receive(:new)
      .with(access_key_id: str, secret_access_key: str, region: str)
      .and_return(cw)
  end

  let(:infra) { build(:infrastructure) }
  let(:cloud_watch) { CloudWatch.new(infra) }

  describe '.new' do
    it do
      expect(CloudWatch.new(infra)).to be_a CloudWatch
    end
  end

  describe '#get_networkinout' do
    let(:time1) { Time.zone.local(2014, 4, 9, 3, 8, 1) }
    let(:time2) { Time.zone.local(2014, 4, 9, 3, 13, 1) }
    let(:time3) { Time.zone.local(2014, 4, 9, 3, 18, 1) }
    let(:physical_id) { 'i-fugapiyo' }

    before do
      # Mock for NetworkIn
      allow(cw_client).to receive(:get_metric_statistics)
        .with(hash_including(metric_name: 'NetworkIn'))
        .and_return(double('in_data', datapoints: [
                             { timestamp: time1, average: 1.1 },
                             { timestamp: time2, average: 2.2 },
                             { timestamp: time3, average: 3.3 },
                           ],))
      # Mock for NetworkOut
      allow(cw_client).to receive(:get_metric_statistics)
        .with(hash_including(metric_name: 'NetworkOut'))
        .and_return(double('out_data', datapoints: [
                             { timestamp: time1, average: 4.4 },
                             { timestamp: time2, average: 5.5 },
                             { timestamp: time3, average: 6.6 },
                           ],))
    end

    it 'should be formated' do
      res = cloud_watch.get_networkinout(physical_id)
      # Check time
      expect(res[0][0]).to eq time3.localtime.strftime('%H:%M')
      expect(res[1][0]).to eq time2.localtime.strftime('%H:%M')
      expect(res[2][0]).to eq time1.localtime.strftime('%H:%M')

      # Check in + out = sum
      res.each do |data|
        expect(data[1] + data[2]).to eq data[3]
      end
    end
  end
end
