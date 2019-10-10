#
# Copyright (c) 2013-2018 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

describe Concerns::Cryptize do
  let(:klass) do
    Class.new do
      extend Concerns::Cryptize
   cryptize :value
   def [](name)
     instance_variable_get(:"@#{name}")
   end

   def []=(name, value)
     instance_variable_set(:"@#{name}", value)
   end
    end
  end
  let(:instance) { klass.new }

  describe 'encrypt and decrypt' do
    before do
      instance.value = 'Hello world'
    end

    it 'should encrypt' do
      raw_value = instance.instance_variable_get(:@value)
      expect(raw_value.is_a?(String)).to be_truthy
      expect(raw_value).not_to eq 'Hello world'
    end

    it 'should decrypt' do
      expect(instance.value).to eq 'Hello world'
    end
  end
end
