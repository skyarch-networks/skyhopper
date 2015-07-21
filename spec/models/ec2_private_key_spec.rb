#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Ec2PrivateKey do
  describe 'with validation' do
    describe 'column value' do
      let(:key){build(:ec2_private_key)}

      it 'should be RSA Private Key' do
        key.value = 'invalid as rsa key'
        expect(key.save).to be false
        key.value = attributes_for(:ec2_private_key)[:value]
        expect(key.save).to be true
      end
    end
  end

  describe '.new_from_aws' do
    let(:ec2){double('ec2')}
    let(:key){double('key', key_material: attributes_for(:ec2_private_key)[:value])}

    let(:name){'foobar'}
    let(:project){create(:project)}
    let(:region){'ap-northeast-1'}

    subject{Ec2PrivateKey.new_from_aws(name, project.id, region)}

    before do
      allow_any_instance_of(Infrastructure).to receive(:ec2).and_return(ec2)
      allow(ec2).to receive(:create_key_pair).and_return(key)
    end

    it{is_expected.to be_a Ec2PrivateKey}
  end

  describe '#path_temp' do
    let(:key){build(:ec2_private_key)}
    subject{key.path_temp}

    context 'before output' do
      it{is_expected.to be nil}
    end

    context 'after output' do
      before{key.output_temp}
      it{is_expected.to be_a String}

      it 'file should exist' do
        expect(File.exist?(subject)).to be true
      end
    end
  end

  describe '#close_temp' do
    let(:key){build(:ec2_private_key)}
    subject{key.close_temp}

    context 'before output' do
      it{is_expected.to be nil}
    end

    context 'after output' do
      before{key.output_temp}

      it 'file should not exist' do
        path = key.path_temp
        expect(File.exist?(path)).to be true
        key.close_temp
        expect(File.exist?(path)).to be false
      end
    end
  end
end
