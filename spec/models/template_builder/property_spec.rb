#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

describe TemplateBuilder::Property, type: :model do
  let(:klass){TemplateBuilder::Property}
  describe '@@data_types' do
    subject{klass.class_variable_get(:@@data_types)}

    it{is_expected.to eq [:Boolean, String, Hash, Array]}
    it{is_expected.to be_frozen}
  end

  describe '#initialize' do
    skip
  end

  describe '#required?' do
    context 'when required property' do
      subject{klass.new('foo', String, required: true)}

      it 'should return true' do
        expect(subject.required?).to be_truthy
      end
    end

    context 'when not required property' do
      subject{klass.new('foo', String, required: false)}

      it 'should return false' do
        expect(subject.required?).to be_falsey
      end
    end
  end

  describe '#select?' do
    context 'when select property' do
      subject{klass.new('foo', String, select: true){['foo']}}

      it 'should return true' do
        expect(subject.select?).to be_truthy
      end
    end

    context 'when not select property' do
      subject{klass.new('foo', String, select: false)}

      it 'should return false' do
        expect(subject.select?).to be_falsey
      end
    end
  end

  describe '#get_options' do
    context 'when select property' do
      let(:options){['foo', 'bar']}
      subject{klass.new('foo', String, select: true){options}}

      it 'should return options' do
        expect(subject.get_options).to eq options
      end
    end

    context 'when not select property' do
      subject{klass.new('foo', String, select: false)}

      it do
        expect{subject.get_options}.to raise_error TemplateBuilder::Property::SelectError
      end
    end
  end

  describe '#validate' do
    subject{klass.new('foo', String)}
    let(:val){'hoge'}

    it 'should call #validate_data_type' do
      expect(subject).to receive(:validate_data_type).with(val)
      subject.validate(val)
    end
  end

  describe '#exist_property?' do
    context 'when not Hash' do
      subject{klass.new('foo', String)}

      it{expect(subject.exist_property?({})).to be_falsey}
    end

    context 'when Hash' do
      subject{klass.new('foo', Hash, data_validator: {foo: String})}
      context 'when exist property' do
        it do
          expect(subject.exist_property?({foo: 'bar'})).to be_truthy
        end
      end

      context 'when not exist property' do
        it do
          expect(subject.exist_property?({hoge: 'fuga'})).to be_falsey
        end
      end

      context 'invalid arg' do
        it do
          expect{subject.exist_property?('invalid arg!!')}.to raise_error ArgumentError
        end
      end
    end
  end

  describe '#can_parameterize?' do
    context 'when data_type is String' do
      subject{klass.new('foo', String)}

      it{expect(subject.can_parameterize?).to be_truthy}
    end

    context 'when data_type is Strings Array' do
      subject{klass.new('foo', Array, data_validator: String)}

      it{expect(subject.can_parameterize?).to be_truthy}
    end

    context 'when data_type is not Strings Array' do
      let(:sub_prop){klass.new('bar', String)}
      subject{klass.new('foo', Array, data_validator: sub_prop)}

      it{expect(subject.can_parameterize?).to be_falsey}
    end

    context 'when data_type is other' do
      subject{klass.new('foo', Hash)}

      it{expect(subject.can_parameterize?).to be_falsey}
    end
  end
end
