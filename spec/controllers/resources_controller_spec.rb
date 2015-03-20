#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ResourcesController do
  let(:infra){create(:infrastructure)}
  let(:resources){create_list(:resource, 3, infrastructure: infra)}
  before{resources}

  describe '#index' do
    before{get :index, infra_id: infra.id}

    should_be_success

    it 'should render JSON' do
      JSON.parse(response.body)
    end
  end

  describe '#create' do
    let(:physical_id){'i-hogehoge'}
    let(:screen_name){'hogefuga'}
    let(:ec2_exists){true}
    let(:req){post :create, infra_id: infra.id, physical_id: physical_id, screen_name: screen_name}

    before do
      allow_any_instance_of(Infrastructure).to receive_message_chain(:ec2, :instances, :[], :exists?).and_return(ec2_exists)
    end
    before{req}

    context 'when infra is not create complete' do
      let(:infra){create(:infrastructure, status: 'ROLLBACK_COMPLETE')}
      should_be_failure

      it 'should not increment resources' do
        expect(infra.resources.size).to eq resources.size
      end
    end

    context 'when ec2 does not exists' do
      let(:ec2_exists){false}
      should_be_failure

      it 'should not increment resources' do
        expect(infra.resources.size).to eq resources.size
      end
    end

    context 'when infra is create complete and ec2 exists' do
      let(:infra){create(:infrastructure, status: 'CREATE_COMPLETE')}
      should_be_success

      it 'should increment resource' do
        expect(infra.resources.size).to eq resources.size + 1
      end

      it 'should set physical_id' do
        expect(infra.resources.last.physical_id).to eq physical_id
      end

      it 'should set screen_name' do
        expect(infra.resources.last.screen_name).to eq screen_name
      end
    end
  end
end
