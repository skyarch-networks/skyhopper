#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe InfrastructureLogsController, type: :controller do
  login_user

  describe '#index' do
    before do
      get :index, infrastructure_id: 1
    end

    should_be_success
  end
end
