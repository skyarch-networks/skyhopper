#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Servertest, type: :model do
  let(:klass) { Servertest }
  let(:infra_id) { 1 }

  before(:each) do
    klass.create(infrastructure_id: nil, name: 'recipe_apache2', value: 'code hoge', category: :serverspec)
    klass.create(infrastructure_id: infra_id, name: 'for_infra1', value: 'code fuga', category: :awspec)
    klass.create(infrastructure_id: (infra_id + 1), name: 'for_infra2', value: 'code piyo', category: :awspec)
  end

  describe 'with validation' do
    describe 'column value' do
      let(:servertest) { build(:servertest) }
      it 'should be ruby code' do
        servertest.value = 'invalid as ruby code{{{'
        expect(servertest.save).to be false
        servertest.value = 'valid as ruby code'
        expect(servertest.save).to be true
      end
    end
  end

  it { is_expected.to respond_to(:name) }
  it { is_expected.to respond_to(:infrastructure_id) }
  it { is_expected.to respond_to(:value) }

  describe '.for_infra' do
    it 'should return array' do
      expect(klass.for_infra(infra_id)).to be_kind_of Array
    end

    it 'should return size is 2' do
      expect(klass.for_infra(infra_id).size).to eq 2
    end
  end

  describe '.global' do
    it 'should return global Serverspecs' do
      expect(klass.global).to(be_all { |s| s.infrastructure_id.nil? })
    end
  end

  describe '.to_file' do
    it 'should return spec path' do
      id = klass.first.id
      expect(klass.to_file(id)).to be_kind_of String
    end
  end

  describe '.create_rds' do
    it 'new Servertest instance' do
      rds = double('rds', { engine_type: '', endpoint_address: '' })
      user = 'hoge'
      pass = 'passwd'
      expect(klass.create_rds(rds, user, pass, infra_id)).to be_kind_of klass
    end
  end
end
