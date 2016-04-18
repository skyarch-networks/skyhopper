require 'rails_helper'

RSpec.describe "ZabbixServers", type: :request do
  describe "GET /zabbix_servers" do
    it "works! (now write some real specs)" do
      get zabbix_servers_path
      expect(response).to have_http_status(200)
    end
  end
end
