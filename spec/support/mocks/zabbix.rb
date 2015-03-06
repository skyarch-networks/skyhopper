#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ZabbixStub
  def stubize_zabbix
    let(:_zabbix){double('zabbix')}

    before do
      allow(Zabbix).to receive(:new).and_return(_zabbix)

      str = kind_of(String)
      allow(_zabbix).to receive(:add_hostgroup).with(str).and_return("1")
      allow(_zabbix).to receive(:create_usergroup).with(str, any_args)
      allow(_zabbix).to receive(:get_hostgroup_ids).and_return(["1", "2", "3"]) # .with(String or Array of String)
      allow(_zabbix).to receive(:change_mastergroup_rights).with(array_including(str))
      allow(_zabbix).to receive(:create_user).with(str, str).and_return('1')
      allow(_zabbix).to receive(:update_user)
      allow(_zabbix).to receive(:get_master_usergroup_id).with(no_args)
      allow(_zabbix).to receive(:get_default_usergroup_id).with(no_args)
      allow(_zabbix).to receive(:get_user_id).with(str)
      allow(_zabbix).to receive(:get_usergroup_ids).and_return([1, 2, 3]) #.with(String or Array of String)
      allow(_zabbix).to receive(:delete_hostgroup).and_return([1, 2, 3]).with(str)
      allow(_zabbix).to receive(:delete_usergroup).and_return([1, 2, 3]).with(str)
      allow(_zabbix).to receive(:delete_hosts_by_infra).with(kind_of(Infrastructure))
      allow(_zabbix).to receive(:get_item_info).with(str, str, str).and_return([{'key_' => 'KEY'}])
      allow(_zabbix).to receive(:get_history).with(str, str).and_return([['foo', 'bar']])
    end
  end
end
