#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ServerStatusController, type: :controller do
  login_user

  let(:server){double(:server, start: nil, stop: nil)}
  before do
    allow(ServerState).to receive(:new).and_return(server)
  end

  describe '#strat' do
    %w[chef zabbix].each do |kind|
      context "when #{kind}" do
        before{post :start, kind: kind}
        should_be_success
      end
    end
  end

  describe '#stop' do
    %w[chef zabbix].each do |kind|
      context "when #{kind}" do
        before{post :stop, kind: :chef}
        should_be_success
      end
    end
  end

  describe '#status' do
    # TODO
  end
end
