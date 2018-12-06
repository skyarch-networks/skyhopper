#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ServerState, type: :model do
  servers = %w[zabbix chef]

  let(:server){double('@server')}
  before(:all) do
    unless Client.for_system
      c = create(:client, code: Client::ForSystemCodeName)
    end
    unless Project.for_chef_server
      p = create(:project, code: Project::ChefServerCodeName, client: c)
      i = create(:infrastructure, project: p)
      create(:ec2_resource, infrastructure: i)
    end

    unless Project.for_zabbix_server
      p = create(:project, code: Project::ZabbixServerCodeName, client: c)
      i = create(:infrastructure, project: p)
      create(:ec2_resource, infrastructure: i)
    end
  end
  before do
    allow_any_instance_of(Infrastructure).to receive(:instance).and_return server
  end


  describe '.new' do
    servers.each do |kind|
      context "when kind is #{kind}" do
        subject{ServerState.new(kind)}
        it{is_expected.to be_a ServerState}
      end
    end

    context 'when invalid kind' do
      subject{ServerState.new('invalid as kind')}
      it {expect{subject}.to raise_error(ArgumentError)}
    end

    context 'when infra not found' do
      subject{ServerState.new('zabbix')}
      before do
        zabbix_server = Project.for_zabbix_server
        zabbix_server.infrastructures = []
        zabbix_server.save!
      end
      it {expect{subject}.to raise_error(ServerState::InfrastructureNotFound)}
    end
  end

  let(:chef){ServerState.new('chef')}
  let(:zabbix){ServerState.new('zabbix')}
  let(:server_status){{'chef' => chef, 'zabbix' => zabbix}}

  let(:status){SecureRandom.base64(10)}
  before do
    [server, chef, zabbix].each do |s|
      allow(s).to receive(:status).and_return(status)
    end
  end

  describe '#status' do
    servers.each do |kind|
      context "when #{kind}" do
        context 'when not cached' do
          before do
            Rails.cache.clear("serverstate-#{kind}")
          end

          it 'should return status' do
            expect(server_status[kind].status).to eq status
          end
        end
        context 'when cached' do
          before do
            Rails.cache.write("serverstate-#{kind}", status)
          end

          it 'should return cached status' do
            expect(server_status[kind].status).to eq status
          end
        end
      end
    end
  end

  describe '#latest_status' do
    servers.each do |kind|
      before do
        Rails.cache.clear("serverstate-#{kind}")
      end

      it 'should update cache' do
        server_status[kind].latest_status
        expect(Rails.cache.read("serverstate-#{kind}")).to eq status
      end

      it 'should return status' do
        expect(server_status[kind].latest_status).to eq status
      end
    end
  end

  describe '#start' do
    servers.each do |kind|
      context "when server is #{kind}" do
        it 'should call @server.start' do
          expect(server).to receive(:start)
          server_status[kind].start
        end
      end
    end
  end

  describe '#stop' do
    servers.each do |kind|
      context "when server is #{kind}" do
        it 'should call @server.stop' do
          expect(server).to receive(:stop)
          server_status[kind].stop
        end
      end
    end
  end

  describe '#is_running?' do
    servers.each do |kind|
      context "when server is #{kind}" do
        subject{server_status[kind].is_running?}

        context 'when isnot running' do
          it{is_expected.to be false}
        end

        context 'when running' do
          let(:status){'running'}

          it{is_expected.to be true}
        end
      end
    end
  end

  describe '#is_in_progress?' do
    servers.each do |kind|
      context "when server is #{kind}" do
        subject{server_status[kind].is_in_progress?}

        %w[pending stopping].each do |s|
          context "when #{s}" do
            let(:status){s}
            it {is_expected.to be true}
          end
        end

        %w[running stopped terminated].each do |s|
          context "when #{s}" do
            let(:status){s}
            it {is_expected.to be false}
          end
        end
      end
    end
  end
end
