require 'rails_helper'

RSpec.describe "zabbix_servers/new", type: :view do
  before(:each) do
    assign(:zabbix_server, ZabbixServer.new(
      :fqdn => "MyString",
      :username => "MyString",
      :password => "MyString",
      :version => "MyString",
      :details => "MyString"
    ))
  end

  it "renders new zabbix_server form" do
    render

    assert_select "form[action=?][method=?]", zabbix_servers_path, "post" do

      assert_select "input#zabbix_server_fqdn[name=?]", "zabbix_server[fqdn]"

      assert_select "input#zabbix_server_username[name=?]", "zabbix_server[username]"

      assert_select "input#zabbix_server_password[name=?]", "zabbix_server[password]"

      assert_select "input#zabbix_server_version[name=?]", "zabbix_server[version]"

      assert_select "input#zabbix_server_details[name=?]", "zabbix_server[details]"
    end
  end
end
