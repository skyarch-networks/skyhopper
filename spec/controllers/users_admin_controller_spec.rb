#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'


describe UsersAdminController, :type => :controller do
  login_user

  let(:klass){User}
  let(:user){create(:user)}
  let(:admin_status){false}
  let(:master_status){false}
  let(:user_hash) { attributes_for(:user, admin: admin_status, master: master_status) }

  describe '#index' do
    before do
      get :index
    end

    should_be_success

    it 'should assign @users' do
      expect(assigns[:users]).to eq klass.all.page(1).per(10)
    end
  end

  describe '#new' do
    before do
      get :new
    end

    should_be_success

    it 'should assign @user' do
      expect(assigns[:user]).to be_kind_of klass
    end
  end

  describe '#create' do
    let(:create_request){post :create, user: user_hash}
    let(:admin_user_group){1}
    let(:user_data){{"userids" => [1]}}

    stubize_zabbix

    context 'when valid params' do
      it 'should assign @user' do
        create_request
        expect(assigns[:user]).to be_a klass
      end

      it do
        create_request
        expect(response).to redirect_to(action: :index)
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(User).to receive(:save!).and_raise
        create_request
      end

      it do
        expect(response).to redirect_to(action: :new)
      end
    end
  end

  describe '#edit' do
    before do
      create(:user_project, user: user)
    end

    before do
      post :edit, id: user.id
    end

    should_be_success

    it 'should assign @user' do
      expect(assigns[:user]).to eq user
    end

    it 'should assigns @clients' do
      expect(assigns[:clients]).to eq Client.all
    end

    it 'should assigns @allowed_projects_title' do
      subject = assigns[:allowed_projects_title]
      expect(subject).to be_kind_of Array
      expect(subject.first).to be_has_key :project_id
      expect(subject.first).to be_has_key :title
    end

    it do
      expect(response).to render_template('_edit')
    end
  end

  describe '#update' do
    stubize_zabbix

    context 'when master' do
      before do
        create_list(:project, 3, users: [user])
      end

      it 'should delete all UserProject' do
        expect(user.projects).not_to be_empty
        put :update, id: user.id, master: 'true', admin: 'true'
        expect(user.projects).to be_empty
      end
    end

    context 'when not master' do
      let(:allowed_projects){create_list(:project, 3).map{|prj|prj.id}}

      it 'should update UserProject' do
        put :update, id: user.id, master: 'false', admin: 'true', allowed_projects: allowed_projects
        expect(user.projects.pluck(:id)).to eq allowed_projects
      end
    end
  end

  describe '#destroy' do
    let(:zabbix){double('Zabbix')}

    before do
      allow(Zabbix).to receive(:new).and_return(zabbix)
    end

    it 'should destroy user' do
      allow(zabbix).to receive(:delete_user)
      expect(klass.exists?(user.id)).to be true
      delete :destroy, id: user.id
      expect(klass.exists?(user.id)).to be false
    end

    it 'should destroy user from zabbix' do
      expect(zabbix).to receive(:delete_user)
      delete :destroy,  id: user.id
    end
  end
end
