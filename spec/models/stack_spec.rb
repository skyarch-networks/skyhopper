#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Stack, type: :model do
  let(:stack_name){'StackName'}
  let(:infra){build_stubbed(:infrastructure, stack_name: stack_name)}
  subject {Stack.new(infra)}

  it{expect(subject.inspect).to eq "#<Stack: #{stack_name}>"}

  describe "#create" do
    let(:params){double('params')}
    let(:template){double('template')}
    let(:cf){subject.instance_variable_get(:@cloud_formation)}

    it "call @cloud_formation#create_stack" do
      expect(cf).to receive(:create_stack).with(
        stack_name: stack_name,
        template_body: template,
        parameters: params,
        capabilities: %w[CAPABILITY_IAM])
      subject.create(template, params)
    end
  end

  describe "#instances" do
    let(:ec2_instance) do
      double("ec2_instance", resource_type: "AWS::EC2::Instance")
    end

    let(:s3_bucket) do
      double("s3_bucket", resource_type: "AWS::S3::Bucket")
    end

    let(:resources) do
      [ec2_instance, s3_bucket]
    end

    it "returns only EC2 Instances" do
      allow(subject.instance_variable_get(:@stack)).to receive(:resource_summaries).and_return(resources)
      instances = subject.instances
      expect(instances).to eq([ec2_instance])
    end
  end

  describe "#in_progress?" do
    context "status is in progress" do
      let(:status_list) do
        ['CREATE_IN_PROGRESS', 'ROLLBACK_IN_PROGRESS', 'DELETE_IN_PROGRESS', 'UPDATE_IN_PROGRESS', 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS', 'UPDATE_ROLLBACK_IN_PROGRESS', 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS']
      end

      it "returns true" do
        status_list.each do |status|
          expect(subject).to receive(:status).and_return({status: status})
          expect(subject.in_progress?).to be_truthy
        end
      end
    end

    context "status is not in progress" do
      let(:status_list) do
        ['CREATE_FAILED', 'CREATE_COMPLETE', 'ROLLBACK_FAILED', 'ROLLBACK_COMPLETE', 'DELETE_FAILED', 'DELETE_COMPLETE',  'UPDATE_COMPLETE',  'UPDATE_ROLLBACK_FAILED', 'UPDATE_ROLLBACK_COMPLETE']
      end

      it "returns false" do
        status_list.each do |status|
          expect(subject).to receive(:status).and_return({status: status})
          expect(subject.in_progress?).to be_falsey
        end
      end
    end
  end

  describe '.failed?' do
    Stack::CompleteStatus.each do |status|
      context "when #{status}" do
        it{expect(subject.failed?(status)).to be false}
      end
    end

    Stack::FailedStatus.each do |status|
      context "when #{status}" do
        it{expect(subject.failed?(status)).to be true}
      end
    end
  end

  describe '.complete?' do
    Stack::CompleteStatus.each do |status|
      context "when #{status}" do
        it{expect(subject.complete?(status)).to be true}
      end
    end
  end

  describe '#get_resources' do
    let(:instances){[
      double(
        'rds',
        resource_type: 'AWS::RDS::DBInstance',
        physical_resource_id:   'i-hogefuga',
      ),
      double(
        'ec2',
        resource_type: 'AWS::EC2::Instance',
        physical_resource_id:   'i-piyopoyo',
      ),
    ]}
    before do
      allow(subject).to receive(:instances_for_resources).and_return(instances)
      allow_any_instance_of(Infrastructure).to receive_message_chain(:instance, :tags_by_hash)
        .and_return({'Name' => 'SCREEN_NAME'})
    end

    it 'should return Array of Resource' do
      expect(subject.get_resources).to be_a Array
      expect(subject.get_resources).to be_all{|r| r.kind_of?(Resource)}
    end
  end
end
