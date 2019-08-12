#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ClientsController, type: :controller do
  login_user
  let(:client_codename) { attributes_for(:client, code: 'hoge', name: 'fuga') }

  describe '#index' do
    before { get :index }

    context 'when index accessed' do
      it 'should assign clients' do
        expect(assigns(:clients)).to(be_all { |client| client.is_a? Client })
      end
    end
  end

  describe 'GET #new' do
    context 'when accessed' do
      before { get :new }

      it '@client should have a new object' do
        expect(assigns(:client)).to be_a_new(Client)
      end

      it 'should render new.html.erb' do
        expect(response).to render_template :new
      end
    end
  end

  describe 'POST #create' do
    let(:request) { post :create, client: client_codename }

    context 'when valid params' do
      it 'should create a new client and save' do
        request
        expect(assigns(:client)).to be_a(Client)
        expect(assigns(:client)).to be_persisted
      end

      it 'should render index' do
        request
        expect(response).to redirect_to(clients_path)
      end

      it 'flash notice should not be blank' do
        expect(request.request.flash[:notice]).to_not be_nil
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Client).to receive(:save).and_return(false)
      end

      it 'should not be saved' do
        request
        expect(assigns(:client)).not_to be_persisted
      end

      it 'should render new' do
        request
        expect(response).to render_template :new
      end

      it 'flash alert should be not blank' do
        expect(request.request.flash[:alert]).to_not be_nil
      end
    end
  end

  describe 'PATCH #update' do
    let(:client) { create(:client) }
    let(:update_request) { patch :update, id: client.id, client: client_codename }

    context 'when valid params' do
      it 'should update code and name' do
        update_request
        c = Client.find(client.id)
        expect(c.code).to eq('hoge')
        expect(c.name).to eq('fuga')
      end

      it 'should redirect to client_path' do
        update_request
        expect(response).to redirect_to(clients_path)
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Client).to receive(:update).and_return(false)
      end

      it 'code and name should not have been changed' do
        update_request
        c = Client.find(client.id)
        expect(c.code).not_to eq('hoge')
        expect(c.name).not_to eq('fuga')
      end

      it 'should render edit' do
        update_request
        expect(response).to render_template :edit
      end
    end
  end

  describe '#destroy' do
    let(:client) { create(:client) }
    let(:request) { delete :destroy, id: client.id }

    stubize_zabbix
    run_zabbix_server

    context 'when destroy success' do
      before { request }

      it 'client should be deleted' do
        expect(Client).not_to be_exists(id: client.id)
      end

      it do
        expect(response).to redirect_to(clients_path)
      end
    end

    context 'when destroy fail' do
      let(:err_msg) { 'errorerrorerror' }
      before { allow_any_instance_of(Client).to receive(:destroy!).and_raise(StandardError, err_msg) }
      before { request }

      it 'client should be exist' do
        expect(Client).to be_exists(id: client.id)
      end

      it do
        expect(response).to redirect_to(clients_path)
      end

      it 'should be alert' do
        expect(request.request.flash[:alert]).to eq err_msg
      end
    end
  end

  describe '#client_exist' do
    controller ClientsController do
      before_action :client_exist
      def index
        render text: 'success!'
      end
    end
    let(:req) { get :index, id: client.id }
    let(:client) { create(:client) }

    context 'when not have id' do
      let(:client) { double('client', id: nil) }
      before { req }
      should_be_success
    end

    context 'when clinet does not exists' do
      before do
        client.delete
        req
      end
      it { is_expected.to redirect_to clients_path }
    end

    context 'when client is exists' do
      before { req }
      should_be_success
    end
  end
end
