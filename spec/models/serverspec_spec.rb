#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

# TODO: refactor
describe Serverspec, :type => :model do
  let(:klass){Serverspec}

  describe 'with validation' do
    describe 'column value' do
      let(:serverspec){build(:serverspec)}
      it 'should be ruby code' do
        serverspec.value = 'invalid as ruby code{{{'
        expect(serverspec.save).to be false
        serverspec.value = 'valid as ruby code'
        expect(serverspec.save).to be true
      end
    end
  end

  before(:each) do
    klass.create(infrastructure_id: nil, name: 'recipe_apache2', value: 'code hoge')
    klass.create(infrastructure_id: 1, name: 'for_infra1', value: 'code fuga')
    klass.create(infrastructure_id: 2, name: 'for_infra2', value: 'code piyo')
  end

  it {is_expected.to respond_to(:name)}
  it {is_expected.to respond_to(:infrastructure_id)}
  it {is_expected.to respond_to(:value)}

  describe '.for_infra' do
    it 'return array' do
      expect(klass.for_infra(1)).to be_kind_of Array
    end

    it 'return size == 2' do
      expect(klass.for_infra(1).size).to eq 2
    end
  end

  describe '.global' do
    it 'should return global Serverspecs' do
      expect(klass.global).to be_all{|s|s.infrastructure_id.nil?}
    end
  end

  describe '.to_file' do
    it 'return spec path' do
      expect(klass.to_file(1)).to be_kind_of String
    end
  end

  describe '.create_rds' do
    let(:rds){double('rds', {engine_type: '', endpoint_address: ''})}
    user = 'hoge'
    pass = 'passwd'
    infrastructure_id = 1

    it 'new Serverspec instance' do
      expect(klass.create_rds(rds, user, pass, infrastructure_id)).to be_kind_of klass
    end
  end
end
