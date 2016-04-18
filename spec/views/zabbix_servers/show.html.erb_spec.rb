require 'rails_helper'

RSpec.describe "zabbix_servers/show", type: :view do
  before(:each) do
    @zabbix_server = assign(:zabbix_server, ZabbixServer.create!(
      :fqdn => "Fqdn",
      :username => "Username",
      :password => "Password",
      :version => "Version",
      :details => "Details"
    ))
  end

  it "renders attributes in <p>" do
    render
    expect(rendered).to match(/Fqdn/)
    expect(rendered).to match(/Username/)
    expect(rendered).to match(/Password/)
    expect(rendered).to match(/Version/)
    expect(rendered).to match(/Details/)
  end
end
