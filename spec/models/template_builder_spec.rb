#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

class StubRes < TemplateBuilder::Resource; end

describe TemplateBuilder, type: :model do
  describe 'class variables' do
    describe '@@base_template' do
      it 'should be Hash' do
        expect(TemplateBuilder.class_variable_get(:@@base_template)).to be_kind_of Hash
      end
    end

    describe '@@ami_mappings' do
      it 'should be Hash' do
        expect(TemplateBuilder.class_variable_get(:@@ami_mappings)).to be_kind_of Hash
      end
    end
  end

  describe 'class methods' do
    describe '.resources' do
      subject{TemplateBuilder.resources}
      it 'should be Strings in Array' do
        is_expected.to be_kind_of Array
        subject.each do |r|
          expect(r).to be_kind_of String
        end
      end
    end

    describe '.resource' do
      subject{TemplateBuilder.resource('EC2::Instance')}
      it 'should be return Resource class' do
        is_expected.to eq TemplateBuilder::Resource::EC2::Instance
      end
    end
  end

  describe 'instance methods' do
    let(:builder){TemplateBuilder.new}

    describe '#add' do
      context 'method success' do
        let(:res){StubRes.new('foo')}
        subject{builder.instance_variable_get(:@resources)}

        it '@resources added Resource' do
          is_expected.to be_empty
          builder.add(res)
          is_expected.not_to be_empty
        end
      end

      context 'recieve invalid arg' do
        subject{builder.add(nil)}
        it do
          expect{subject}.to raise_error ArgumentError
        end
      end

      context 'resource already exist' do
        res_name = 'hoge'
        before do
          builder.add(StubRes.new(res_name))
        end

        it do
          expect{builder.add(StubRes.new(res_name))}.to raise_error TemplateBuilder::ResourceAlreadyExist
        end
      end
    end

    describe '#add_param' do
      context 'method success' do
        let(:param){double('kind_of?': true, name: 'foo')}
        subject{builder.instance_variable_get(:@parameters)}

        it do
          is_expected.to be_empty
          builder.add_param(param)
          is_expected.not_to be_empty
        end
      end

      context 'recieve invalid arg' do
        subject{builder.add_param(nil)}
        it do
          expect{subject}.to raise_error ArgumentError
        end
      end

      context 'parameter already exist' do
        let(:param){double('kind_of?': true, name: 'bar')}
        subject{builder.add_param(param)}
        before do
          builder.add_param(param)
        end

        it do
          expect{subject}.to raise_error TemplateBuilder::ParameterAlreadyExist
        end
      end
    end

    describe '#add_output' do
      context 'method success' do
        let(:output){double('kind_of?': true, name: 'foo')}
        subject{builder.instance_variable_get(:@outputs)}

        it do
          is_expected.to be_empty
          builder.add_output(output)
          is_expected.not_to be_empty
        end
      end

      context 'recieve invalid arg' do
        subject{builder.add_output(nil)}
        it  do
          expect{subject}.to raise_error ArgumentError
        end
      end

      context 'output already exist' do
        let(:output){double('kind_of?': true, name: 'bar')}
        subject{builder.add_output(output)}
        before do
          builder.add_output(output)
        end

        it  do
          expect{subject}.to raise_error TemplateBuilder::OutputAlreadyExist
        end
      end
    end

    describe '#build' do
      subject{builder.build}

      it do
        is_expected.to be_kind_of Hash
      end
    end

    describe '#to_json' do
      before do
        allow(builder).to receive(:build).and_return({foo: 'bar'})
      end
      subject{builder.to_json}

      it 'return json' do
        JSON::parse(subject)
      end
    end

    describe '#to_pretty_json' do
      before do
        allow(builder).to receive(:build).and_return({foo: 'bar'})
      end
      subject{builder.to_pretty_json}

      it 'return json' do
        JSON::parse(subject)
      end
    end
  end
end
