#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

RSpec.describe MonitoringsController, :type => :controller do
  login_user
  stubize_zabbix
  run_zabbix_server

  let(:infra){create(:infrastructure)}
  let(:physical_id){"i-#{SecureRandom.base64(10)}"}

  describe '#show' do
    let(:req){get :show, id: infra.id}
    before do
      create(:ec2_resource, infrastructure: infra)
    end

    context 'before register' do
      before do
        allow(_zabbix).to receive(:host_exists?).and_return(false)
        req
      end

      should_be_success

      it '@before_register should be true' do
        expect(assigns[:before_register]).to be true
      end
    end

    context 'after register' do
      before do
        allow(_zabbix).to receive(:host_exists?).and_return(true)
        create_list(:monitoring, 3, infrastructure: infra)
        req
      end

      should_be_success

      # XXX データをcreateする
      it 'should assigns @monitor_selected_common' do
        expect(assigns[:monitor_selected_common]).to eq infra.master_monitorings.where(is_common: true)
      end

      # XXX データをcreateする
      it 'should assigns @monitor_selected_uncommon' do
        expect(assigns[:monitor_selected_uncommon]).to eq infra.master_monitorings.where(is_common: false)
      end

      it 'should assigns @resources' do
        expect(assigns[:resources]).to eq infra.resources.ec2
      end
    end
  end

  describe '#show_cloudwatch_graph' do
    let(:req){get :show_cloudwatch_graph, id: infra.id, physical_id: physical_id}
    let(:cloud_watch){double(:cloud_watch)}
    let(:net_data){['foo', 'bar']}

    before do
      allow(CloudWatch).to receive(:new).with(kind_of(Infrastructure)).and_return(cloud_watch)
      allow(cloud_watch).to receive(:get_networkinout).with(physical_id).and_return(net_data)
      req
    end

    should_be_success

    it 'should render network data as JSON' do
      expect(JSON.parse(response.body)).to eq net_data
    end
  end

  # TODO: context mysql.login
  describe '#show_zabbix_graph' do
    let(:item_key){SecureRandom.base64(10)}
    let(:req){get :show_zabbix_graph, physical_id: physical_id, item_key: item_key}
    let(:history){['foo', 'bar', 'hoge']}
    before do
      allow(_zabbix).to receive(:get_history).and_return(history)
      req
    end

    should_be_success

    it 'should render history as JSON' do
      expect(JSON.parse(response.body)).to eq history
    end
  end

  describe '#show_problems' do
    let(:req){get :show_problems, id: infra.id}
    let(:problems){['foo', 'bar', 'nya']}
    before do
      allow(_zabbix).to receive(:show_recent_problems).and_return(problems).with(kind_of(Infrastructure))
      req
    end

    should_be_success

    it 'should render history as JSON' do
      expect(JSON.parse(response.body)).to eq problems
    end
  end

  describe '#show_url_status' do
    let(:req){get :show_url_status, id: infra.id}
    let(:url_status){{'foo '=> 'bar', 'piyo' => 'poyo'}}
    before do
      allow(_zabbix).to receive(:get_url_status_monitoring).and_return(url_status).with(kind_of(Infrastructure))
      req
    end

    should_be_success

    it 'should render history as JSON' do
      expect(JSON.parse(response.body)).to eq url_status
    end
  end

  describe '#edit' do
    let(:req){get :edit, id: infra.id}
    before do
      create(:ec2_resource, infrastructure: infra)
    end

    context 'before register' do
      before do
        allow(_zabbix).to receive(:host_exists?).and_return(false)
        req
      end

      should_be_failure
    end

    context 'after register' do
      let(:exprs){double('trigger-expressions')}
      let(:web_scenarios){double('web-scenarios')}
      before do
        allow(_zabbix).to receive(:host_exists?).and_return(true)
        allow(_zabbix).to receive(:get_trigger_expressions_by_hostname).with(kind_of(String)).and_return(exprs)
        allow(_zabbix).to receive(:all_web_scenarios).with(kind_of(Infrastructure)).and_return(web_scenarios)
        req
      end

      should_be_success

      it 'should assign @master_monitorings' do
        expect(assigns[:master_monitorings]).to eq MasterMonitoring.all
      end

      it 'should assign @selected_monitoring_ids' do
        expect(assigns[:selected_monitoring_ids]).to eq infra.monitorings.pluck(:master_monitoring_id)
      end

      it 'should assign @trigger_expressions' do
        expect(assigns[:trigger_expressions]).to eq exprs
      end

      it 'should assign @web_scenarios' do
        expect(assigns[:web_scenarios]).to eq web_scenarios
      end
    end
  end
end
