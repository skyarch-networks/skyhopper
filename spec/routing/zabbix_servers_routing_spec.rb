require "rails_helper"

RSpec.describe ZabbixServersController, type: :routing do
  describe "routing" do

    it "routes to #index" do
      expect(:get => "/zabbix_servers").to route_to("zabbix_servers#index")
    end

    it "routes to #new" do
      expect(:get => "/zabbix_servers/new").to route_to("zabbix_servers#new")
    end

    it "routes to #show" do
      expect(:get => "/zabbix_servers/1").to route_to("zabbix_servers#show", :id => "1")
    end

    it "routes to #edit" do
      expect(:get => "/zabbix_servers/1/edit").to route_to("zabbix_servers#edit", :id => "1")
    end

    it "routes to #create" do
      expect(:post => "/zabbix_servers").to route_to("zabbix_servers#create")
    end

    it "routes to #update via PUT" do
      expect(:put => "/zabbix_servers/1").to route_to("zabbix_servers#update", :id => "1")
    end

    it "routes to #update via PATCH" do
      expect(:patch => "/zabbix_servers/1").to route_to("zabbix_servers#update", :id => "1")
    end

    it "routes to #destroy" do
      expect(:delete => "/zabbix_servers/1").to route_to("zabbix_servers#destroy", :id => "1")
    end

  end
end
