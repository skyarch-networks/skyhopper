#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Zabbix, type: :model do
  describe '.new' do
    let(:set){AppSetting.get}
    let(:zabbix){double('method result')}

    before do
      expect_any_instance_of(SkyZabbix::Client).to receive(:login).with(
        set.zabbix_user,
        set.zabbix_pass,
      )
    end

    subject{Zabbix.new(set.zabbix_user, set.zabbix_pass)}
    it {is_expected.to be_a Zabbix}


    it 'should set @sky_zabbix' do
      expect(subject.instance_variable_get(:@sky_zabbix)).to be_a SkyZabbix::Client
    end
  end
end
