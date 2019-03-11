#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

FactoryGirl.create(:app_setting)
describe SystemServer::Deployment, type: :model do
  let(:klass){SystemServer::Deployment}

  describe '.create_zabbix' do
    let(:stack_name){'FooStack'}
    let(:region){'ap-northeast-1'}
    let(:keypair_name){'hogekey'}
    let(:keypair_value){'hogehogeRSAhogehoge'}

    let(:infra){create(:infrastructure)}
    let(:project){create(:project)}
    let(:stack){double('stack')}
    let(:set){create(:app_setting)}
    let(:physical_id){'i-hogefuga'}

    let(:system_server){klass.new(infra, physical_id)}

    before do
      allow(klass).to receive(:new).and_return(
        double('system_server_deployment', wait_init_ec2: nil, fqdn: 'example.com')
      )

      allow(stack).to receive_message_chain(:instances, :first, :physical_resource_id).and_return(physical_id)

      allow(Infrastructure).to receive(:create_with_ec2_private_key).and_return(infra)

      # TODO テストが走る順番に影響を受けてしまうため、修正すること
      unless Client.find_by(code: Client::ForSystemCodeName)
        client = create(:client, code: Client::ForSystemCodeName)
        create(:project, code: Project::ZabbixServerCodeName, client: client)
      end
    end

    it 'should call methods' do
      expect(klass).to receive(:create_stack).with(infra, 'Zabbix Server', String, Hash).and_return(stack)
      expect(klass).to receive(:wait_creation).with(stack)

      klass.create_zabbix(
        stack_name,
        region,
        keypair_name,
        keypair_value
      )
    end
  end

  describe 'private methods' do
    describe '.create_stack' do
      let(:infra){create(:infrastructure)}
      let(:cf_template){double('cf_template')}
      let(:stack){double('stack')}

      before do
        allow(CfTemplate).to receive(:new).and_return(cf_template)
        allow(cf_template).to receive(:parsed_cfparams)
      end

      before do
        allow(Stack).to receive(:new).and_return(stack)
      end

      subject{klass.__send__(:create_stack, infra, 'Zabbix Server', ERB::Builder.new('zabbix_server').build)}


      it 'should call methods' do
        expect(cf_template).to receive(:create_cfparams_set).with(infra, Hash)
        expect(cf_template).to receive(:update_cfparams).with(no_args)
        expect(cf_template).to receive(:save!).with(no_args)
        expect(stack).to       receive(:create).with(any_args)

        expect(subject).to eq stack
      end
    end

    describe '.wait_creation' do
      let(:stack){double('stack')}

      subject{klass.__send__(:wait_creation, stack)}

      it 'should call Stack#wait_status' do
        expect(stack).to receive(:wait_status).with("CREATE_COMPLETE")

        subject
      end
    end
  end

  describe '#initialize' do
    let(:infra){create(:infrastructure)}
    let(:physical_id){'i-hogehoge'}
    subject{klass.new(infra, physical_id)}

    it 'should assign @infra' do
      expect(subject.instance_variable_get(:@infra)).to eq infra
    end

    it 'should assign @physical_id' do
      expect(subject.instance_variable_get(:@physical_id)).to eq physical_id
    end
  end

  describe '#fqdn' do
    let(:infra){create(:infrastructure)}
    let(:physical_id){'i-fugafuga'}
    subject{klass.new(infra, physical_id)}

    it 'should call infra.instance.public_dns_name' do
      expect(infra).to receive_message_chain(:instance, :public_dns_name)
      subject.fqdn
    end

    it 'should memolize' do
      allow(infra).to receive_message_chain(:instance, :public_dns_name)
      fqdn = subject.fqdn
      expect(subject.instance_variable_get(:@fqdn)).to eq fqdn
    end
  end

  describe '#fqdn' do
    let(:infra){create(:infrastructure)}
    let(:physical_id){'i-fugafuga'}
    subject{klass.new(infra, physical_id)}

    it 'should call infra.instance.public_ip_address' do
      expect(infra).to receive_message_chain(:instance, :public_dns_name)
      subject.fqdn
    end

    it 'should memolize' do
      allow(infra).to receive_message_chain(:instance, :public_dns_name)
      ip_addr = subject.fqdn
      expect(subject.instance_variable_get(:@fqdn)).to eq ip_addr
    end
  end
end
