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
  stubize_zabbix
  run_zabbix_server

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
    let(:master){true}
    let(:admin){true}
    let(:req){post :create, user: attributes_for(:user, master: master, admin: admin)}


    context 'when User#save! raise error' do
      before do
        allow_any_instance_of(User).to receive(:save!).and_raise
        req
      end

      it {is_expected.to redirect_to action: :new}
    end

    context 'when User#save! success' do
      context 'when master and admin' do
        let(:master){true}
        let(:admin){true}
        before{req}

        it {is_expected.to redirect_to action: :index}
      end

      context 'when master only' do
        let(:master){true}
        let(:admin){false}
        before{req}

        it {is_expected.to redirect_to action: :index}
      end

      context 'when zabbix error' do
        before do
          allow(Zabbix).to receive(:new).and_raise
          req
        end
        it {is_expected.to redirect_to action: :new}
      end
    end
  end

  describe '#create' do
    let(:create_request){post :create, user: user_hash}
    let(:admin_user_group){1}
    let(:user_data){{"userids" => [1]}}

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

    it "should assign instance variables" do
      expect(assigns[:user]).to eq user
      expect(assigns[:clients]).to eq Client.all
      expect(assigns[:mfa_key]).to be_a String
      expect(assigns[:mfa_qrcode]).to be_a String
    end

    it 'should assigns @allowed_projects_title' do
      subject = assigns[:allowed_projects_title]
      expect(subject).to be_kind_of Array
      expect(subject.first).to be_has_key :project_id
      expect(subject.first).to be_has_key :title
    end

    it {is_expected.to render_template('_edit')}
  end

  describe '#update' do
    request_as_ajax

    let(:master){true}
    let(:admin){true}
    let(:allowed_projects){nil}
    let(:password){nil}
    let(:password_confirm){password}
    let(:req){put :update, id: user.id, master: master, admin: admin, allowed_projects: allowed_projects, password: password, password_confirmation: password_confirm}

    context 'when set password' do
      let(:password){'hoge'}
      context 'when password not match' do
        let(:password_confirm){'fuga'}
        before{req}
        should_be_failure
        should_be_json
      end

      context 'when password match' do
        before{req}
        should_be_success
      end
    end

    context 'when master' do
      before do
        create_list(:project, 3, users: [user])
      end

      it 'should delete all UserProject' do
        expect(user.projects).not_to be_empty
        req
        expect(user.projects).to be_empty
      end
    end

    context 'when master only' do
      let(:master){true}
      let(:admin){false}
      before{req}

      should_be_success
    end

    context 'when not master' do
      let(:allowed_projects){create_list(:project, 3).map{|prj|prj.id}}
      let(:master){false}
      before{req}

      it 'should update UserProject' do
        expect(user.projects.pluck(:id)).to eq allowed_projects
      end
    end
  end

  describe '#sync_zabbix' do
    before do
      create(:user, master: true, admin: true)
      create(:user, master: true, admin: false)
      create(:user, master: false, admin: true)
      create(:user, master: false, admin: false)
      put :sync_zabbix
    end

    should_be_success
  end

  describe '#destroy' do
    let(:req){delete :destroy, id: user.id}

    context 'when delete success' do
      it 'should destroy user' do
        expect(User).to be_exists user.id
        req
        expect(User).not_to be_exists user.id
      end
    end

    context 'when delete failure' do
      before do
        allow(_zabbix).to receive(:delete_user).and_raise
        req
      end

      it {is_expected.to redirect_to action: :index}

      it 'should not delete user' do
        expect(User).to be_exists user.id
      end
    end
  end
end
