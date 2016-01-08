#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ProjectsController, type: :controller do
  login_user

  let(:client){create(:client)}
  let(:project){create(:project, client: client)}
  let(:project_hash){attributes_for(:project, client_id: client.id)}

  describe '#index' do
    let(:req){get :index, client_id: client.id}

    context 'when not have client_id' do
      let(:client){double('client', id: nil)}
      before{req}

      it {is_expected.to redirect_to clients_path}
    end

    context 'when user master' do
      before{req}
      should_be_success

      it 'assigns @selected_client' do
        expect(assigns[:selected_client]).to be_kind_of Client
      end

      it 'assigns @projects' do
        expect(assigns[:projects]).to eq client.projects.to_a
      end
    end

    context 'when user doesnot master' do
      login_user(master: false)
      before{req}
      should_be_success

      it 'assigns @projects' do
        expect(assigns[:projects]).to eq current_user.projects
      end
    end
  end

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
    let(:req){post :create, project: project_hash}
    run_zabbix_server
    stubize_zabbix

    context 'when save fail' do
      before do
        allow_any_instance_of(Project).to receive(:save).and_return(false)
        req
      end
      it {is_expected.to redirect_to new_project_path(client_id: client.id)}
    end

    context 'when zabbix error' do
      before do
        allow(_zabbix).to receive(:create_usergroup).and_raise
        req
      end
      it {is_expected.to redirect_to new_project_path(client_id: client.id)}
    end

    context 'when success' do
      before{req}
      it {is_expected.to redirect_to projects_path(client_id: client.id)}
    end
  end

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

  describe '#client_exist' do
    controller ProjectsController do
      before_action :client_exist
      def authorize(*)end #XXX: pundit hack
      def test
        render text: 'success!!!'
      end
    end
    before{routes.draw{resources(:projects){collection{get :test}}}}
    let(:req){get :test, client_id: client.id}

    context 'when client_id is blank' do
      let(:client){double('client', id: nil)}
      before{req}
      should_be_success
    end

    context 'when client does not exists' do
      before do
        client.destroy
        req
      end
      it {is_expected.to redirect_to clients_path}
    end

    context 'when client exitst' do
      before{req}
      should_be_success
    end
  end

  describe '#project_exist' do
    controller ProjectsController do
      before_action :project_exist
      def authorize(*)end #XXX: pundit hack
      def test
        render text: 'success!!!'
      end
    end
    before{routes.draw{resources(:projects){collection{get :test}}}}
    let(:req){get :test, id: project.id}

    context 'when id is blank' do
      let(:project){double('project', id: nil)}
      before{req}
      should_be_success
    end

    context 'when project exists' do
      before{req}
      should_be_success
    end

    context 'when project does not exists' do
      stubize_zabbix
      before{project.destroy}
      context 'when user not master' do
        login_user(master: false)
        before{req}
        it {is_expected.to redirect_to projects_path}
      end

      context 'when client_id is present' do
        before do
          session[:client_id] = client.id
          req
        end
        it {is_expected.to redirect_to projects_path(client_id: client.id)}
      end

      context 'when client_id is blank' do
        before{req}
        it {is_expected.to redirect_to clients_path}
      end
    end
  end
end
