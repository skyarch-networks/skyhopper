#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ProjectsController, :type => :controller do
  login_user

  let(:client) { Client.create(code: 'CODE', name: 'NAME') }
  let(:project) { create(:project) }
  let(:project_hash) { attributes_for(:project, client_id: client.id) }

  describe '#index' do
    before do
      get :index, client_id: client.id
    end

    should_be_success

    it 'assigns @selected_client' do
      expect(assigns[:selected_client]).to be_kind_of Client
    end

    it 'assigns @projects' do
      expect(assigns[:projects]).to eq client.projects.to_a
    end
  end # end of describe #index

  describe '#new' do
    run_zabbix_server

    before do
      get :new, client_id: client.id
    end

    should_be_success

    it 'assigns @project' do
      expect(assigns[:project]).to be_kind_of Project
    end

    it '@project should have a client_id' do
      expect(assigns[:project].client_id).to eq client.id
    end
  end # end of describe #new

  describe 'POST #create' do
    let(:create_request){post :create, project: project_hash}

    stubize_zabbix
    run_zabbix_server

    context 'when valid params' do
      before{create_request}
      it 'should create a new project and save' do
        expect(assigns(:project)).to be_a Project
      end

      it 'should redirect to projects_path with right id' do
        expect(response).to redirect_to(projects_path(client_id: client.id))
      end

      it 'notice should not be nil' do
        expect(create_request.request.flash[:notice]).to_not be_nil
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Project).to receive(:save).and_return(false)
        create_request
      end

      it 'should not be saved' do
        expect(assigns(:project)).not_to be_persisted
      end

      it do
        expect(response).to redirect_to(new_project_path(client_id: client.id))
      end

      it 'alert should not be nil' do
        expect(create_request.request.flash[:alert]).to_not be_nil
      end
    end
  end # end of describe post #create

  describe 'PATCH #update' do
    let(:new_name){'foobarhogehoge'}
    let(:update_request) {patch :update, id: project.id, project: project_hash.merge(name: new_name)}

    context 'when valid params' do
      before do
        update_request
      end

      it 'should assign @project' do
        expect(assigns[:project]).to be_a Project
      end

      it 'should update finely' do
        p = Project.find(project.id)
        expect(p.name).to eq(new_name)
      end

      it 'should redirect to projects path with correct id' do
        p = Project.find(project.id)
        expect(response).to redirect_to(projects_path(client_id: p.client_id))
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Project).to receive(:update).and_return(false)
        update_request
      end

      it "should redirect_to edit" do
        expect(response).to be_redirect
      end
    end

  end # end of describe patch #update

  describe "GET #edit" do
    let(:edit_request){get :edit, id: project.id}
    let(:cloudprovider_all){CloudProvider.all}

    before {edit_request}

    context "when edit" do
      it "should equal" do
        expect(assigns[:cloud_providers]).to eq cloudprovider_all
      end

      it "should assign project" do
        expect(assigns[:project]).to be_a Project
      end
    end
  end

  describe '#destroy' do
    let(:request){delete :destroy, id: project.id}

    stubize_zabbix
    stubize_infra
    run_zabbix_server

    context 'when delete success' do
      before{request}
      it 'record should be deleted' do
        expect(Project).not_to be_exists(id: project.id)
      end

      it 'should redirect to projects_path' do
        expect(response).to redirect_to(projects_path(client_id: project.client_id))
      end

      it 'should flash notice' do
        expect(request.request.flash[:notice]).to eq I18n.t('projects.msg.deleted')
      end
    end

    context 'whne delete fail' do
      let(:err_msg){'Error! Error!'}
      before do
        allow_any_instance_of(Project).to receive(:destroy!).and_raise(StandardError, err_msg)
        request
      end

      it 'record should be exist' do
        expect(Project).to be_exists(id: project.id)
      end

      it 'should redirect to projects_path' do
        expect(response).to redirect_to(projects_path(client_id: project.client_id))
      end

      it 'should flash alert' do
        expect(request.request.flash[:alert]).to eq err_msg
      end
    end
  end
end
