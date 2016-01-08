#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ProjectParametersController, type: :controller do
  login_user

  let(:project){create(:project)}
  let(:parameters){create_list(:project_parameter, 3, project: project)}

  describe '#show' do
    before do
      parameters
      get :show, project_id: project.id
    end

    it 'should assign @parameters' do
      expect(assigns[:parameters]).to eq parameters
    end
  end

  describe '#update' do
  end
end
