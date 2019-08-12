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
        before { post :start, kind: kind }
        should_be_success
      end
    end
  end

  describe '#stop' do
    %w[zabbix].each do |kind|
      context "when #{kind}" do
        before { post :stop, kind: kind }
        should_be_success
      end
    end
  end

  describe '#status' do
    let(:status) { 'hogefuga' }
    before do
      allow(server).to receive(:status).and_return(status)
      allow(server).to receive(:in_progress?).and_return(false)
    end

    %w[zabbix].each do |kind|
      context "when #{kind}" do
        context 'when not work background' do
          let(:req) { post :status, kind: kind }
          before { req }

          should_be_success

          it 'should render status' do
            expect(response.body).to eq status
          end
        end

        context 'when work background' do
          let(:req) { post :status, kind: kind, background: true }
          # TODO:
        end

        context 'when server in progress' do
          # TODO:
        end
      end
    end
  end
end
