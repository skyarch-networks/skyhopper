#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Zabbix, type: :model do
  describe '.new' do
    let(:set){create :zabbix_server}
    let(:zabbix){double('method result')}
    let(:version) { "3.0.1" }

    before do
      expect_any_instance_of(SkyZabbix::Client).to receive(:login).with(
        set.username,
        set.password
      )
      expect_any_instance_of(SkyZabbix::Client).to receive_message_chain(:apiinfo, :version).and_return(version)
    end

    subject{Zabbix.new(set.fqdn, set.username, set.password)}
    it {is_expected.to be_a Zabbix}


    it 'should set @sky_zabbix' do
      expect(subject.instance_variable_get(:@sky_zabbix)).to be_a SkyZabbix::Client
    end

    it 'should eq version string' do
      expect(subject.instance_variable_get(:@version)).to eq(version)
    end
  end
end
