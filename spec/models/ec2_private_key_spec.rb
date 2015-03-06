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
end
