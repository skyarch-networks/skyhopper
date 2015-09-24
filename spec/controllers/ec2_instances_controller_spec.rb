#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Ec2InstancesController, type: :controller do
  login_user

  let(:physical_id){'i-fugahoge'}
  let(:infra){create(:infrastructure)}

  before do
    current_user.projects = [infra.project]
  end

  describe '#change_scale' do
    let(:type){'t2.micro'}
    let(:req){post :change_scale, id: physical_id, infra_id: infra.id, instance_type: type}

    let(:instance){double(:instance,
      stop:                nil,
      status:              :stopped,
      instance_type:       type,
      start:               nil,
    )}
    before do
      allow(Aws::EC2::Instance).to receive(:new).and_return(instance)
      allow(instance).to receive(:wait_until).and_return(nil)
    end

    before{req}

    should_be_success

    it 'response should include instance_type' do
      expect(response.body).to be_include type
    end

    context 'when invalid instance_type' do
      let(:type){'hoge'}

      should_be_failure
    end
  end

  describe '#start' do
    let(:req){post :start, id: physical_id, infra_id: infra.id}

    let(:instance){double('instance', start: nil)}
    before do
      expect_any_instance_of(Infrastructure).to receive(:instance).with(physical_id).and_return(instance)
      expect_any_instance_of(Ec2InstancesController).to receive(:notify_ec2_status).with(instance, :running)
      req
    end

    should_be_success
  end

  describe '#stop' do
    let(:req){post :stop, id: physical_id, infra_id: infra.id}

    let(:instance){double('instance', stop: nil)}
    before do
      expect_any_instance_of(Infrastructure).to receive(:instance).with(physical_id).and_return(instance)
      expect_any_instance_of(Ec2InstancesController).to receive(:notify_ec2_status).with(instance, :stopped)
      req
    end

    should_be_success
  end

  describe '#reboot' do
    let(:req){post :reboot, id: physical_id, infra_id: infra.id}

    let(:instance){double('instance', reboot: nil)}
    before do
      allow_any_instance_of(Infrastructure).to receive(:instance).with(physical_id).and_return(instance)
      req
    end

    should_be_success
  end

  describe '#serverspec_status' do
    let(:resource){create(:resource)}
    let(:req){get :serverspec_status, id: resource.physical_id, infra_id: infra.id}
    subject{JSON.parse(response.body)['status']}

    context 'when status failed' do
      before do
        st = resource.status.serverspec
        st.failed!
        req
      end

      should_be_success
      it{expect(subject).to be false}
    end

    ['success', 'pending', 'un_executed'].each do |status|
      context "when status #{status}" do
        before do
          st = resource.status.serverspec
          st.value = status
          st.save!
          req
        end

        should_be_success
        it{expect(subject).to be true}
      end
    end
  end

  describe '#register_to_elb' do
    let(:elb_name){'foo-ElasticL-bar'}
    let(:req){post :register_to_elb, id: physical_id, elb_name: elb_name, infra_id: infra.id}

    let(:elb){double('elb')}
    before do
      allow(ELB).to receive(:new).with(infra, elb_name).and_return(elb)
      allow(elb).to receive(:register).with(physical_id)
      req
    end

    should_be_success

    it 'should render message' do
      expect(response.body).to eq I18n.t('ec2_instances.msg.registered_to_elb')
    end
  end

  describe '#deregister_from_elb' do
    let(:elb_name){'fuga-ElasticL-hoge'}
    let(:req){post :deregister_from_elb, id: physical_id, elb_name: elb_name, infra_id: infra.id}

    let(:elb){double('elb')}
    before do
      allow(ELB).to receive(:new).with(infra, elb_name).and_return(elb)
      allow(elb).to receive(:deregister).with(physical_id)
      req
    end

    should_be_success

    it 'should render message' do
      expect(response.body).to eq I18n.t('ec2_instances.msg.deregistered_from_elb')
    end
  end

  describe '#notify_ec2_status' do
    controller Ec2InstancesController do
      def authorize(*)end # XXX: pundit hack
      def test
        instance = double_instance()
        status   = params.require(:status)
        notify_ec2_status(instance, status)
        render text: 'success!'
      end
    end
    before{routes.draw{resources(:ec2_instances){collection{get :test}}}}
    let(:req){get :test, status: status, infra_id: infra.id}
    let(:status){'running'}

    before do
      allow(Thread).to receive(:new_with_db).and_yield
      allow_any_instance_of(Ec2InstancesController).to receive(:double_instance).and_return(instance)
    end

    context 'when instance error' do
      let(:instance){double('instance', physical_id: physical_id)}
      let(:ex){StandardError.new('hoge')}
      before do
        expect(instance).to receive(:wait_status).with(status).and_raise(ex)
      end

      it 'should push error message' do
        expect_any_instance_of(WSConnector).to receive(:push_error).with(ex)
        req
      end
    end

    context 'when success' do
      let(:instance){double('instance', physical_id: physical_id)}
      before do
        expect(instance).to receive(:wait_status).with(status)
      end

      it 'should push error message' do
        expect_any_instance_of(WSConnector).to receive(:push_as_json).with(error: nil, msg: kind_of(String))
        req
      end
    end
  end
end
