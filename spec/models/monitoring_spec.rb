#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'rails_helper'

RSpec.describe Monitoring, type: :model do
  it 'is valid with valid attributes' do
    expect(Monitoring.new).to be_valid
  end
end
