#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe WSConnector do
  let(:redis){double('redis')}
  before do
    allow(Redis).to receive(:new).and_return(redis)
  end

  let(:kind){'kindhogehoge'}
  let(:id){'idfugafuga'}
  let(:instance){WSConnector.new(kind, id)}


  describe '#new' do
    it 'should assign @kind' do
      expect(instance.instance_variable_get(:@kind)).to eq kind
    end

    it 'should assign @id' do
      expect(instance.instance_variable_get(:@id)).to eq id
    end

    it 'should assign @endpoint' do
      expect(instance.instance_variable_get(:@endpoint)).to eq "#{kind}.#{id}"
    end

    it 'should assign @redis' do
      expect(instance.instance_variable_get(:@redis)).to eq redis
    end
  end

  describe '#push' do
    let(:data){'datapiyopiyo'}
    it 'should call Redis#publish' do
      expect(redis).to receive(:publish).with(instance.instance_variable_get(:@endpoint), data)
      instance.push(data)
    end
  end

  describe '#push_as_json' do
    let(:data){{foo: 'bar'}}
    it 'should call Redis#publish' do
      expect(redis).to receive(:publish).with(instance.instance_variable_get(:@endpoint), kind_of(String))
      instance.push_as_json(data)
    end
  end

  describe '#push_error' do
    let(:ex){StandardError.new('hoge')}
    it 'should call Redis#publish' do
      expect(redis).to receive(:publish).with(instance.instance_variable_get(:@endpoint), kind_of(String))
      instance.push_error(ex)
    end
  end
end
