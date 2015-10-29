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

  describe '.resource_types' do
    subject{ServerspecInfo.resource_types}
    it {is_expected.to be_a Array}
    it {is_expected.to be_all{|x| x.is_a? String}}
    it {is_expected.to include 'Selinux'}
  end
end
