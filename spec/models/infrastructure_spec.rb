#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Infrastructure, type: :model do
  let(:klass){Infrastructure}
  let(:ec2key){build(:ec2_private_key)}

  describe '.create_with_ec2_private_key!' do
    let(:params){{
      keypair_name: ec2key.name,
      keypair_value: ec2key.value,
    }}

    it 'should call create!' do
      expect(klass).to receive(:create!).with(klass.__send__(:create_ec2_private_key, params))
      klass.create_with_ec2_private_key!(params)
    end
  end

  describe '.create_with_ec2_private_key' do
    let(:params){{
      keypair_name: ec2key.name,
      keypair_value: ec2key.value,
    }}

    it 'should call create!' do
      expect(klass).to receive(:create).with(klass.__send__(:create_ec2_private_key, params))
      klass.create_with_ec2_private_key(params)
    end
  end

  describe '.create_for_test' do
    before do
      AppSetting.delete_all
      create(:app_setting)
      AppSetting.clear_cache
    end

    let(:project){build_stubbed(:project)}
    subject{Infrastructure.create_for_test(project.id, "DISH_NAME")}

    it{is_expected.to be_a Infrastructure}
  end

  describe '.create_ec2_private_key' do
    let(:params){{
      keypair_name: ec2key.name,
      keypair_value: ec2key.value,
    }}

    subject{lambda{|params| klass.__send__(:create_ec2_private_key, params)}}

    it do
      expect(subject.call(params)).to be_kind_of Hash
    end

    it 'should have Ec2PrivateKey' do
      res = subject.call(params.dup)
      key = Ec2PrivateKey.find(res[:ec2_private_key_id])
      expect(key.name).to eq params[:keypair_name]
      expect(key.value).to eq params[:keypair_value]
    end

    it 'should delete keypair_name' do
      res = subject.call(params)
      expect(res).not_to be_has_key :keypair_name
      expect(res).not_to be_has_key :keypair_value
    end

    context 'when not have keypair_name' do
      it do
        p = params
        p.delete(:keypair_name)
        expect(subject.call(p)[:ec2_private_key_id]).to be_nil
      end
    end
  end

  describe '#resources_or_create' do
    let(:infra){build(:infrastructure, resources: [])}
    let(:resources){build_list(:ec2_resource, 3)}
    subject{infra.resources_or_create}

    context 'when resources already exists' do
      before do
        infra.resources = resources
        infra.save!
      end

      it 'should return resources' do
        expect(subject).to eq resources
      end
    end

    context 'when resources not already exists' do
      stubize_stack
      before do
        allow_any_instance_of(Stack).to receive(:get_resources).and_return(resources)
      end

      it 'should return resources' do
        expect(subject).to eq resources
      end

      it 'should save resources' do
        r = subject
        expect(infra.resources).to eq r
      end
    end
  end

  describe '#resources_updated?' do
    let(:infra){build(:infrastructure, resources: [])}
    let(:resources){build_list(:ec2_resource, 3)}
    subject{infra.resources_updated?}

    before do
      infra.resources = resources
      infra.save!
      allow_any_instance_of(Stack).to receive(:instances_for_resources).and_return(instances_for_resources)
    end

    context 'when there is a difference in physical_id of resources' do
      let(:instances_for_resources){[]}

      it 'shoud return true' do
        is_expected.to eq true
      end
    end

    context 'when there is not a difference in physical_id of resources' do
      let(:instances_for_resources){resources.map{|resource|
        resource_mock = double('resource')
        allow(resource_mock).to receive(:physical_resource_id).and_return(resource.physical_id)
        resource_mock
      }}

      it 'shoud return false' do
        is_expected.to eq false
      end
    end
  end

  describe '#access_key' do
    subject{build(:infrastructure)}

    it 'should eq Project#access_key' do
      expect(subject.access_key).to eq subject.project.access_key
    end

    it 'memolize @access_key' do
      subject.access_key
      expect(subject.instance_variable_get(:@access_key)).to eq subject.access_key
    end

    it 'memolize @secret_access_key' do
      subject.access_key
      expect(subject.instance_variable_get(:@secret_access_key)).to eq subject.secret_access_key
    end
  end

  describe '#secret_access_key' do
    subject{build(:infrastructure)}

    it 'should eq Project#secret_access_key' do
      expect(subject.secret_access_key).to eq subject.project.secret_access_key
    end

    it 'memolize @access_key' do
      subject.access_key
      expect(subject.instance_variable_get(:@access_key)).to eq subject.project.access_key
    end

    it 'memolize @secret_access_key' do
      subject.access_key
      expect(subject.instance_variable_get(:@secret_access_key)).to eq subject.project.secret_access_key
    end
  end

  describe '#detach_chef' do
    subject{build(:infrastructure)}

    it 'should call Stack#detach_chef' do
      expect(Stack).to receive_message_chain(:new, :detach_chef)
      subject.detach_chef
    end
  end

  describe '#ec2' do
    subject{build(:infrastructure)}


    it 'return Aws::EC2::Client' do
      result = double('result')

      expect(::Aws::EC2::Client).to receive(:new).with(
        access_key_id: subject.access_key,
        secret_access_key: subject.secret_access_key,
        region: subject.region
      ).and_return(result)

      expect(subject.ec2).to eq result
    end
  end

  describe '#instance' do
    subject{build(:infrastructure)}
    let(:physical_id){'hogehoge'}

    it do
      expect(EC2Instance).to receive(:new).with(subject, physical_id: physical_id)
      subject.instance(physical_id)
    end
  end

  describe '#rds' do
    subject{build(:infrastructure)}
    let(:physical_id){'foofoooo'}

    it do
      expect(RDS).to receive(:new).with(subject, physical_id)
      subject.rds(physical_id)
    end
  end

  describe '#create_complete?' do
    subject{infra.create_complete?}
    context 'when create complete' do
      let(:infra){build(:infrastructure, status: 'CREATE_COMPLETE')}
      it{is_expected.to be true}
    end

    context 'when not create complete' do
      let(:infra){build(:infrastructure, status: 'ROLLBACK_COMPLETE')}
      it{is_expected.to be false}
    end
  end

  describe '#client' do
    let(:infra){create(:infrastructure)}
    subject{infra.client}
    it {is_expected.to eq infra.project.client}
  end
end
