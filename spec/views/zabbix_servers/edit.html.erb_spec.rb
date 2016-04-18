require 'rails_helper'

RSpec.describe "zabbix_servers/edit", type: :view do
  before(:each) do
    @zabbix_server = assign(:zabbix_server, ZabbixServer.create!(
      :fqdn => "MyString",
      :username => "MyString",
      :password => "MyString",
      :version => "MyString",
      :details => "MyString"
    ))
  end

  it "renders the edit zabbix_server form" do
    render

    assert_select "form[action=?][method=?]", zabbix_server_path(@zabbix_server), "post" do

      assert_select "input#zabbix_server_fqdn[name=?]", "zabbix_server[fqdn]"

      assert_select "input#zabbix_server_username[name=?]", "zabbix_server[username]"

      assert_select "input#zabbix_server_password[name=?]", "zabbix_server[password]"

      assert_select "input#zabbix_server_version[name=?]", "zabbix_server[version]"

      assert_select "input#zabbix_server_details[name=?]", "zabbix_server[details]"
    end
  end
end
