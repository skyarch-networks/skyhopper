#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe SnapshotsController, type: :controller do
  login_user
  let(:infra) { create(:infrastructure) }
  let(:project) { infra.project }
  let(:volume_id) { 'any_id-test-123' }

  describe '#index' do
    before { get :index, params: { infra_id: infra.id, volume_id: volume_id } }

    should_be_success

    context 'when index accessed' do
      let(:infra) { create(:infrastructure) }
      before do
        allow_any_instance_of(Snapshot).to receive(:describe).with(:infra, :volume_id)
      end
      should_be_success
    end
  end
end
