#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ServerStatusController, type: :controller do
  login_user

  let(:server) { double(:server, start: nil, stop: nil, kind: nil) }
  before do
    allow(ServerState).to receive(:new).and_return(server)
    allow(ServerStateWorker).to receive(:perform_now)
  end

  describe '#start' do
    %w[zabbix].each do |kind|
      context "when #{kind}" do
        before { post :start, params: { kind: kind } }
        should_be_success
      end
    end
  end

  describe '#stop' do
    %w[zabbix].each do |kind|
      context "when #{kind}" do
        before { post :stop, params: { kind: kind } }
        should_be_success
      end
    end
  end

  describe '#status' do
    let(:status) { 'hogefuga' }
    let(:latest_status) { 'foobar' }
    let(:in_progress?) { false }
    before do
      allow(server).to receive(:status).and_return(status)
      allow(server).to receive(:latest_status).and_return(latest_status)
      allow(server).to receive(:in_progress?).and_return(in_progress?)
    end

    %w[zabbix].each do |kind|
      context "when #{kind}" do
        let(:req) { post :status, params: { kind: kind } }
        before { req }

        context 'when not work background' do
          should_be_success

          it 'should render status' do
            expect(response.body).to eq status
          end
        end

        context 'when work background' do
          let(:req) { post :status, params: { kind: kind, background: true } }

          should_be_success

          it 'should render status' do
            expect(response.body).to eq latest_status
          end
        end

        context 'when server in progress' do
          let(:in_progress?) { true }

          should_be_success

          it 'should render status' do
            expect(response.body).to eq latest_status
          end
        end
      end
    end
  end
end
