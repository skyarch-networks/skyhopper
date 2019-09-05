#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe NodesController, type: :controller do
  login_user
  let(:infra) { create(:infrastructure) }
  let(:physical_id) { attributes_for(:resource)[:physical_id] }

  describe '#show' do
    let(:resource) { create(:resource, infrastructure: infra, dish: dish) }
    let(:request) { get :show, infra_id: infra.id, id: resource.physical_id, format: 'json' }

    # mocks
    let(:instance) { double('instance') }
    let(:instance_status) { :running } # 各コンテキストで場合によって上書き
    let(:instance_summary) do
      {
        status: instance_status,
        block_devices: [],
      }
    end
    let(:availability_zones) do
      {
        available: [],
      }
    end
    let(:ansible_status) { resource.status.ansible }
    let(:servertest_status) { resource.status.servertest }
    let(:yum_status) { resource.status.yum }
    before do
      allow_any_instance_of(Infrastructure).to receive(:instance).and_return(instance)
      allow(instance).to receive(:summary).and_return(instance_summary)
      allow(instance).to receive(:availability_zones).and_return(availability_zones)
    end

    let(:dish) { create(:dish) }

    %i[terminated stopped].each do |state|
      context "when instance #{state}" do
        let(:instance_status) { state }
        before { request }

        should_be_success
        it 'should assign @instance_summary' do
          expect(assigns[:instance_summary]).to eq instance_summary
        end
      end
    end

    context 'when all success' do
      before { request }

      it 'should assigns @info' do
        expect(assigns[:info]).to be_a Hash
        expect(assigns[:info][:ansible_status]).to eq ansible_status
        expect(assigns[:info][:servertest_status]).to eq servertest_status
        expect(assigns[:info][:update_status]).to eq yum_status
      end

      it 'should assigns @dishes' do
        expect(assigns[:dishes]).to eq Dish.valid_dishes(infra.project_id)
      end
    end
  end

  describe '#apply_dish' do
    let(:resource) { create(:resource, infrastructure: infra) }
    let(:req) { post :apply_dish, id: resource.physical_id, infra_id: infra.id, dish_id: dish.id }

    context "when dish's playbook_roles is empty" do
      let(:dish) { create(:dish, playbook_roles: '[]') }
      before { req }

      should_be_success

      it 'should render message' do
        expect(response.body).to eq I18n.t('nodes.msg.playbook_empty')
      end
    end

    context "when dish's playbook_roles is not empty" do
      let(:dish) { create(:dish, playbook_roles: '["aaa", "bbb"]', extra_vars: '{"aaa": "bbb"}') }
      before { req }

      should_be_success

      it 'apply dish parameter' do
        resource.reload
        expect(resource.get_playbook_roles).to eq %w[aaa bbb]
        expect(resource.extra_vars).to eq '{"aaa": "bbb"}'
      end

      it 'should render message' do
        expect(response.body).to eq I18n.t('nodes.msg.dish_applied')
      end
    end
  end

  describe '#yum_update' do
    let(:security) { 'security' }
    let(:exec) { 'exec' }
    let(:resource) { create(:resource) }
    let(:req) { put :yum_update, id: resource.physical_id, infra_id: resource.infrastructure.id, security: security, exec: exec }

    before do
      allow_any_instance_of(NodesController).to receive(:exec_yum_update)
        .with(resource.infrastructure, resource.physical_id, security == 'security', exec == 'exec')
      req
    end

    it 'status should be 202' do
      expect(response.status).to eq 202
    end

    it 'should render text' do
      expect(response.body).to eq I18n.t('nodes.msg.yum_update_started')
    end
  end

  describe '#edit_ansible_playbook' do
    let(:req) { get :edit_ansible_playbook, id: resource.physical_id, infra_id: infra.id }
    let(:resource) { create(:resource, infrastructure: infra) }

    before do
      allow(Ansible).to receive(:get_roles).and_return(%w[aaa bbb])
      req
    end

    should_be_success

    it 'should assign @playbook_roles' do
      expect(assigns[:playbook_roles]).to eq resource.get_playbook_roles
    end

    it 'should assign @roles' do
      expect(assigns[:roles]).to eq %w[aaa bbb]
    end

    it 'should assign @extra_vars' do
      expect(assigns[:extra_vars]).to eq resource.get_extra_vars
    end
  end

  describe '#update_ansible_playbook' do
    let(:playbook_roles) { %w[aaa bbb] }
    let(:extra_vars) { '{"aaa":"abc"}' }
    let(:req) { put :update_ansible_playbook, id: resource.physical_id, infra_id: infra.id, playbook_roles: playbook_roles, extra_vars: extra_vars }
    let(:resource) { create(:resource, infrastructure: infra) }
    let(:status) { true }
    let(:message) { 'hogefuga piyoyo' }

    before do
      allow_any_instance_of(NodesController).to receive(:update_playbook).and_return({ status: status, message: message })
      req
    end

    context 'when update success' do
      should_be_success

      it 'should render text' do
        expect(response.body).to eq I18n.t('nodes.msg.playbook_updated')
      end
    end

    context 'when update fail' do
      let(:status) { false }
      should_be_failure

      it 'should render text' do
        expect(response.body).to eq message
      end
    end
  end

  describe '#run_ansible_playbook' do
    let(:resource) { create(:resource) }
    let(:run_ansible_playbook_request) { put :run_ansible_playbook, id: resource.physical_id, infra_id: resource.infrastructure.id }

    before do
      allow(Thread).to receive(:new_with_db).and_yield
      expect_any_instance_of(NodesController).to receive(:run_ansible_playbook_node)
      run_ansible_playbook_request
    end

    it 'should render' do
      expect(response.body).not_to be nil
    end

    it 'should be success' do
      expect(response.status).to eq 202
    end
  end

  describe '#update_playbook' do
    controller NodesController do
      def show
        physical_id = params.require(:id)
        infra_id    = params.require(:infra_id)
        infra       = Infrastructure.find(infra_id)
        playbook_roles = params.require(:playbook_roles)
        extra_vars = params.require(:extra_vars)
        render json: update_playbook(physical_id: physical_id, infrastructure: infra, playbook_roles: playbook_roles, extra_vars: extra_vars)
      end
    end
    let(:playbook_roles) { %w[aaa bbb] }
    let(:extra_vars) { '{"aaa":"abc"}' }
    let(:resource) { create(:resource, physical_id: physical_id, infrastructure: infra) }
    let(:req) { get :show, id: physical_id, infra_id: infra.id, playbook_roles: playbook_roles, extra_vars: extra_vars }
    before do
      resource
    end

    context 'when success' do
      before do
        req
      end

      should_be_success

      it 'should status is true, message is nil' do
        expect(JSON[response.body]['status']).to be true
        expect(JSON[response.body]['message']).to be nil
      end

      it 'should update ansible and servertest status' do
        expect(resource.status.ansible.value).to eq 'un_executed'
        expect(resource.status.servertest.value).to eq 'un_executed'
      end

      it 'resource should have playbook_roles JSON' do
        resource.reload
        expect(resource.playbook_roles).to eq '["aaa","bbb"]'
      end

      it 'resource should have extra_vars' do
        resource.reload
        expect(resource.extra_vars).to eq extra_vars
      end
    end

    context 'when failure' do
      let(:err_msg) { 'THIS IS ERROR!!!' }
      before do
        expect_any_instance_of(Resource).to receive(:save!).and_raise(err_msg)
        req
      end

      should_be_success

      it 'should status is false, message is error message' do
        expect(JSON[response.body]['status']).to be false
        expect(JSON[response.body]['message']).to eq err_msg
      end
    end
  end

  describe '#run_ansible_playbook_node' do
    controller NodesController do
      def show
        physical_id = params.require(:id)
        infra_id = params.require(:infra_id)
        infra = Infrastructure.find(infra_id)
        run_ansible_playbook_node(infra, physical_id)
        render nothing: true
      end
    end
    let(:resource) { create(:resource, infrastructure: infra) }
    let(:req) { get :show, id: resource.physical_id, infra_id: infra.id }

    context 'when success' do
      before do
        expect_any_instance_of(Node).to receive(:run_ansible_playbook).and_yield('hoge')
        req
      end
      should_be_success

      it 'should ansible status is Success' do
        expect(resource.status.ansible.success?).to be true
      end
    end

    context 'when failure' do
      before do
        allow_any_instance_of(Node).to receive(:run_ansible_playbook).and_raise
        req
      end
      should_be_success

      it 'should ansible status is Failed' do
        expect(resource.status.ansible.failed?).to be true
      end
    end
  end
end
