#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

class TemplateBuilder::Resource::TestResource < TemplateBuilder::Resource
end

describe TemplateBuilder::Resource, type: :model do
  let(:klass) { TemplateBuilder::Resource::TestResource }
  let(:klass_name) { 'TestResource' }
  let(:required_prop) { double(:required_prop, required?: true, name: :required_prop, validate: true) }
  let(:not_required_prop) { double(:required_prop, required?: false, name: :not_required_prop, validate: true) }

  describe 'class methods' do
    describe '.resource_type' do
      subject { klass.resource_type }

      it { is_expected.to eq klass_name }
    end

    describe '.duped_resource_base' do
      subject { klass.duped_resource_base }

      it do
        is_expected.to eq klass.class_variable_get(:@@resource_base)
      end
      it 'should not same object' do
        is_expected.not_to equal klass.class_variable_get(:@@resource_base)
      end
    end

    describe '.properties' do
      subject { klass.properties }
      before do
        klass.class_variable_set(:@@properties, %w[foo bar])
      end

      it { is_expected.to eq klass.class_variable_get(:@@properties) }
    end

    describe '.inherited' do
      describe 'define Type' do
        subject { klass::Type }
        it { is_expected.to eq "AWS::#{klass_name}" }
      end

      describe 'define @@resource_base' do
        subject { klass.class_variable_get(:@@resource_base) }

        it { is_expected.not_to be_nil }
        it { is_expected.to be_kind_of Hash }
      end
    end

    describe '.required_properties' do
      before do
        klass.class_variable_set(:@@properties, [required_prop, not_required_prop])
      end

      subject { klass.required_properties }

      it 'should return required properties' do
        is_expected.to eq [required_prop]
      end
    end
  end

  describe '#initialize' do
    let(:name) { 'hoge' }
    subject { klass.new(name) }

    it 'should set @name' do
      expect(subject.name).to eq name
    end
    it 'should set @param_properties' do
      expect(subject.param_properties).to eq Set.new
    end
    it 'should set @properties' do
      expect(subject.instance_variable_get(:@properties)).to eq({})
    end
  end

  describe '#set_properties' do
    subject { klass.new('foo') }
    let(:prop) { { required_prop: 'foo' } }
    before do
      klass.class_variable_set(:@@properties, [required_prop, not_required_prop])
    end

    it do
      subject.set_properties(prop)
      expect(subject.instance_variable_get(:@properties)).to eq prop
    end
  end

  describe '#set_refs_params' do
    let(:name) { 'foo' }
    let(:prop) { { required_prop: nil } }
    subject { klass.new(name) }
    before do
      klass.class_variable_set(:@@properties, [required_prop, not_required_prop])
    end

    it 'should set ref name' do
      expect(subject).to receive(:set_refs).with({ required_prop: "#{name}#{required_prop.name}" })
      subject.set_refs_params(prop)
    end
  end

  describe '#set_refs' do
    subject { klass.new('foo') }
    let(:prop) { { required_prop: 'foo' } }
    let(:invalid_prop) { { not_required_prop: nil } }
    before do
      klass.class_variable_set(:@@properties, [required_prop, not_required_prop])
    end

    context 'receive invalid properties' do
      it 'raise error' do
        expect { subject.set_refs(invalid_prop) }.to raise_error TemplateBuilder::Resource::InvalidPropertyError
      end
    end

    context 'receive valid properties' do
      before do
        subject.set_refs(prop)
      end

      it 'should set refs' do
        p = subject.instance_variable_get(:@properties)
        key = prop.keys.first
        expect(p).to eq({ key => { Ref: prop[key] } })
      end
    end
  end

  describe '#resource_type' do
    it 'should call Resource.resource_type' do
      expect(klass).to receive(:resource_type)

      klass.new('foo').resource_type
    end
  end

  describe '#build' do
    subject { klass.new('foo') }

    context 'when not set required properties' do
      before do
        klass.class_variable_set(:@@properties, [required_prop])
      end

      it 'should raise error' do
        expect { subject.build }.to raise_error TemplateBuilder::Resource::BuildError
      end
    end

    context 'build success' do
      before do
        klass.class_variable_set(:@@properties, [not_required_prop])
      end

      it 'should return Hash' do
        expect(subject.build).to be_kind_of Hash
      end
    end
  end
end
