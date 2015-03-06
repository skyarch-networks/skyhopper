#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

describe TemplateBuilder::Output, :type => :model do
  let(:klass){TemplateBuilder::Output}

  describe '#initialize' do
    let(:name){'foo'}
    subject{klass.new(name)}

    it 'assign @name' do
      expect(subject.instance_variable_get(:@name)).to eq name
    end
  end

  describe '#set' do
    let(:desc){'hogehoge'}
    let(:value){'fugafuga'}
    subject{klass.new('foo')}

    it 'assign @description' do
      subject.set(description: desc)
      expect(subject.instance_variable_get(:@description)).to eq desc
    end

    it 'assign @value' do
      subject.set(value: value)
      expect(subject.instance_variable_get(:@value)).to eq value
    end
  end

  describe '#build' do
    let(:desc){'hogehoge'}
    let(:value){'fugafuga'}
    let(:name){'fooo'}
    subject{klass.new(name)}

    context 'when not have description' do
      it do
        subject.set(value: value)
        expect{subject.build}.to raise_error klass::BuildError
      end
    end

    context 'when not have value' do
      it do
        subject.set(description: desc)
        expect{subject.build}.to raise_error klass::BuildError
      end
    end

    context 'set value and description' do
      it 'return hash' do
        subject.set(description: desc, value: value)
        expect(subject.build).to eq({name => {Description: desc, Value: value}})
      end
    end
  end
end
