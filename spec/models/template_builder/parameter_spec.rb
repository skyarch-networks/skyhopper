#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

describe TemplateBuilder::Parameter, type: :model do
  let(:string_prop){double(:string_prop, can_parameterize?: true, data_type: String)}
  let(:array_prop) {double(:array_prop,  can_parameterize?: true, data_type: Array)}
  let(:cannt_parameterize_prop){double(:cannt_parameterize_prop, can_parameterize?: false)}

  let(:klass){TemplateBuilder::Parameter}

  describe '#initialize' do
    context 'when invalid arg' do
      it do
        expect{klass.new('foo', cannt_parameterize_prop)}.to raise_error TemplateBuilder::Parameter::InvalidDataType
      end
    end

    context 'when data_type is String' do
      let(:name){'foo'}
      subject{klass.new(name, string_prop)}
      it 'should set @type' do
        expect(subject.instance_variable_get(:@type)).to eq 'String'
      end
      it 'should set @name' do
        expect(subject.instance_variable_get(:@name)).to eq name.to_sym
      end
      it 'should set @property' do
        expect(subject.instance_variable_get(:@property)).to eq string_prop
      end
    end

    context 'when data_type is Array' do
      let(:name){'bar'}
      subject{klass.new(name, array_prop)}
      it 'should set @type' do
        expect(subject.instance_variable_get(:@type)).to eq 'CommaDelimitedList'
      end
      it 'should set @name' do
        expect(subject.instance_variable_get(:@name)).to eq name.to_sym
      end
      it 'should set @property' do
        expect(subject.instance_variable_get(:@property)).to eq array_prop
      end
    end
  end

  describe '#build' do
    let(:name){'hoge'}
    context 'when data_type is String' do
      subject{klass.new(name, string_prop)}

      it 'should return Hash' do
        expect(subject).to receive(:build_for_string).with(any_args)
        expect(subject.build).to be_kind_of Hash
      end
    end

    context 'when data_type is Array' do
      subject{klass.new(name, array_prop)}

      it 'should return Hash' do
        expect(subject).to receive(:build_for_array).with(any_args)
        expect(subject.build).to be_kind_of Hash
      end
    end
  end
end
