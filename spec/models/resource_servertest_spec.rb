#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

RSpec.describe ResourceServertest, type: :model do
  it 'is valid with valid attributes' do
    expect(ResourceServertest.new).to be_valid
  end
end
