#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ProjectParametersController, type: :controller do
  login_user

  let(:project){create(:project)}

  describe '#show' do
    let(:parameters){create_list(:project_parameter, 3, project: project)}
    let(:req){get :show, project_id: project.id}

    before do
      parameters
      req
    end

    should_be_success

    it 'should assign @parameters' do
      expect(assigns[:parameters]).to eq parameters
    end

    it 'should assign @read_only' do
      expect(assigns[:updatable]).to be true
    end

    context 'when can not update user' do
      let(:req){nil} # override request for re-login
      login_user(admin: false)
      before do
        get :show, project_id: project.id
      end

      should_be_success

      it 'should assign false into @read_only' do
        expect(assigns[:updatable]).to be false
      end
    end
  end

  describe '#update' do
    let(:req){put :update, project_id: project.id, parameters: JSON.generate(parameters)}
    before do
      req
    end

    context 'create parameters' do
      let(:key){"hoge"}
      let(:value){SecureRandom.hex(10)}
      let(:parameters){[{id: nil, key: key, value: value}]}

      should_be_success

      it 'should create parameters' do
        p = ProjectParameter.find_by(project: project, key: key)
        expect(p).not_to be nil
        expect(p.value).to eq value
      end
    end

    context 'update parameters' do
      let(:exist_param){create(:project_parameter, project: project)}
      let(:value){SecureRandom.hex(10)}
      let(:parameters){[{id: exist_param.id, changed: true, value: value}]}

      should_be_success

      it 'should update parameters' do
        p = ProjectParameter.find(exist_param.id)
        expect(p.value).to eq value
      end
    end

    context 'destroy parameters' do
      let(:exist_param){create(:project_parameter, project: project)}
      let(:parameters){[]}
      let(:req){nil} # override request

      before do
        exist_param
      end

      it 'should destroy parameters' do
        expect(ProjectParameter).to be_exists exist_param.id

        put :update, project_id: project.id, parameters: JSON.generate(parameters)

        expect(ProjectParameter).not_to be_exists exist_param.id
      end
    end
  end
end
