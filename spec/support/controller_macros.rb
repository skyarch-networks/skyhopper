#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ControllerMacros
  def login_user(master: true, admin: true)
    before(:each) do
      sign_out User
      @request.env["devise.mapping"] = Devise.mappings[:user]
      sign_in FactoryGirl.create(:user, master: master, admin: admin)
    end
  end

  # zabbix server が走っている状態になる
  def run_zabbix_server
    before do
      zabbix = double('server-state-zabbix-running', should_be_running!: true)
      allow(ServerState).to receive(:new).with('zabbix').and_return(zabbix)
    end
  end

  # Ajax としてリクエストする
  def request_as_ajax
    before do
      request.env['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest'
    end
  end

  def should_be_success
    it do
      expect(response).to be_success,
        -> () { "expected success, but response code is #{response.code}. #{request.flash.alert}" }
    end
  end

  def should_be_failure
    it do
      expect(response).not_to be_success,
        -> () { "expected failure, but response code is #{response.code}, response body is #{response.body.inspect}" }
    end
  end

  def should_be_json
    it 'response body should be json' do
      expect{JSON.parse(response.body)}.not_to raise_error
    end
  end
end

module ControllerMacrosInclude
  def current_user
    return User.find(session['warden.user.user.key'][0][0])
  end
end
