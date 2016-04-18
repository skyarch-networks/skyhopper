require 'rails_helper'

RSpec.describe "zabbix_servers/index", type: :view do
  before(:each) do
    assign(:zabbix_servers, [
      ZabbixServer.create!(
        :fqdn => "Fqdn",
        :username => "Username",
        :password => "Password",
        :version => "Version",
        :details => "Details"
      ),
      ZabbixServer.create!(
        :fqdn => "Fqdn",
        :username => "Username",
        :password => "Password",
        :version => "Version",
        :details => "Details"
      )
    ])
  end

  it "renders a list of zabbix_servers" do
    render
    assert_select "tr>td", :text => "Fqdn".to_s, :count => 2
    assert_select "tr>td", :text => "Username".to_s, :count => 2
    assert_select "tr>td", :text => "Password".to_s, :count => 2
    assert_select "tr>td", :text => "Version".to_s, :count => 2
    assert_select "tr>td", :text => "Details".to_s, :count => 2
  end
end
