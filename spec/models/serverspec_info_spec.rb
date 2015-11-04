#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ServerspecInfo do
  describe '.remote' do
    subject{ServerspecInfo.remote}
    it {is_expected.to be_a DRbObject}
  end

  describe '.get' do
    subject{ServerspecInfo.get}
    it {is_expected.to be_a Hash}
    it {is_expected.not_to be_empty}

    it 'has Selinux key' do
      expect(subject.keys).to be_a Array
      expect(subject.keys).to include :selinux
      expect(subject.keys).to be_all{|type| type.to_s =~ /^[a-z0-9_]+$/}
    end

    it 'matchers' do
      is_expected.not_to be_empty
      subject.each do |_, value|
        expect(value[:matchers]).to be_a Array
        expect(value[:matchers]).to be_all{|x|x.is_a? Symbol}
        expect(value[:matchers]).not_to include :be_exists
      end
    end

    it 'its_targets' do
      is_expected.not_to be_empty
      subject.each do |_, value|
        expect(value[:its_targets]).to be_a Array
        expect(value[:matchers]).to be_all{|x|x.is_a? Symbol}
      end
    end
  end
end
