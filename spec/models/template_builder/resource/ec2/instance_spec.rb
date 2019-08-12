#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../../../spec_helper'

# XXX: require しないと動かない
require Rails.root.join('app', 'models', 'template_builder', 'resource')
describe TemplateBuilder::Resource::EC2::Instance, type: :model do
  let(:klass) { TemplateBuilder::Resource::EC2::Instance }
  describe 'INSTANCE_TYPES' do
    subject { klass::INSTANCE_TYPES }

    it { is_expected.to be_kind_of Hash }
    it { is_expected.to be_frozen }
  end

  describe '@@properties' do
    subject { klass.class_variable_get(:@@properties) }
    %i[InstanceType DisableApiTermination Monitoring SecurityGroupIds Tags].each do |prop|
      it "include #{prop}" do
        expect(subject.any? { |x| x.name == prop }).to be_truthy
      end
    end
  end

  describe '.instance_types' do
    subject { klass.instance_types }

    it 'should eq INSTANCE_TYPES.keys' do
      is_expected.to eq klass::INSTANCE_TYPES.keys
    end
  end

  describe '#virtual_type' do
    subject { klass.new('foo') }

    context 'when t1.micro' do
      before do
        subject.set_properties(InstanceType: 't1.micro')
      end

      it 'should PV' do
        expect(subject.virtual_type).to eq :PV
      end
    end

    context 'when t2.micro' do
      before do
        subject.set_properties(InstanceType: 't2.micro')
      end

      it 'should HVM' do
        expect(subject.virtual_type).to eq :HVM
      end
    end

    context 'when not set InstanceType' do
      before do
        subject.instance_variable_get(:@properties).delete(:InstanceType)
      end

      it 'should nil' do
        expect(subject.virtual_type).to be_nil
      end
    end

    context 'when Ref' do
      before do
        subject.set_refs_params(InstanceType: nil)
      end

      it 'should HVM' do
        expect(subject.virtual_type).to eq :HVM
      end
    end
  end
end
