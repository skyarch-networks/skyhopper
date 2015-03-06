#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Zabbix, :type => :model do
  describe '.new' do
    let(:set){AppSetting.get}
    let(:zabbix){double('method result')}

    before do
      allow(ZabbixApi).to receive(:connect).and_return(zabbix)
    end

    before do
      allow(zabbix).to receive_message_chain(:hostgroups, :create)
    end

    subject{Zabbix.new(set.zabbix_user, set.zabbix_pass)}
    it 'should call ZabbixApi.connect' do
      expect(ZabbixApi).to receive(:connect).with(
        url: include(set.zabbix_fqdn),
        user: set.zabbix_user,
        password: set.zabbix_pass
      )
      subject
    end


    it 'should set @zabbix' do
      expect(subject.instance_variable_get(:@zabbix)).to eq zabbix
    end
  end
end
