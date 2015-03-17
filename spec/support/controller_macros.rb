#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ControllerMacros
  def login_user(master: true, admin: true)
    before(:each) do
      @request.env["devise.mapping"] = Devise.mappings[:user]
      sign_in FactoryGirl.create(:user, master: master, admin: admin)
    end
  end

  # zabbix server が走っている状態になる
  def run_zabbix_server
    before do
      zabbix = double('server-state-zabbix-running', is_running?: true)
      allow(ServerState).to receive(:new).with('zabbix').and_return(zabbix)
    end
  end

  def should_be_success
    it do
      expect(response).to be_success
    end
  end

  def should_be_failure
    it do
      expect(response).not_to be_success
    end
  end
end
