#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ServerspecsController, :type => :controller do
  login_user
  let(:infrastructure){create(:infrastructure)}
  let(:svrsp_name){'name'}
  let(:svrsp_desc){'description'}
  let(:svrsp_value){'value'}
  let(:serverspec){attributes_for(:serverspec, name: svrsp_name, description: svrsp_desc, value: svrsp_value, infrastructure_id: infrastructure_id)}

  describe '#index' do
    let(:req){get :index, infrastructure_id: infrastructure.id}

    before do
      create_list(:serverspec, 3, infrastructure_id: infrastructure.id)
      req
    end

    it 'should assign @serverspec' do
      expect(assigns[:serverspecs]).to be_all{|serverspec|serverspec.kind_of?(Serverspec)}
    end

    context 'when accessed index without infrastracture id' do
      let(:infrastructure){double("dummy", id: nil)}

      it 'should render index' do
        expect(response).to render_template :index
      end

      it 'infrastructure name should be nil' do
        expect(assigns[:infrastructure_name]).to be_nil
      end
    end

    context 'when accessed index with infrastracture id' do
      it 'infrawtructure name should not be nil' do
        expect(assigns[:infrastructure_name]).to eq infrastructure.stack_name
      end

      it 'should assign @serverspecs where infra id = infra.id(from url)' do
        expect(assigns[:serverspecs]).to be_all{|serverspec|serverspec.infrastructure_id == infrastructure.id}
      end
    end
  end # end of describe #index

  describe 'Get #new' do
    let(:get_new){get :new}

    before do
      get_new
    end

    context 'when accessed' do
      it 'should render new' do
        expect(response).to render_template :new
      end

      it 'serverspec.value should be pre-set' do
        expect(assigns(:serverspec).value).to eq("require 'serverspec_helper'\n\n")
      end
    end

    context 'when accessed without infrastructure_id' do
      it 'should assign serverspec without infrastracture_id' do
        expect(assigns(:serverspec).infrastructure_id).to be_nil
      end
    end

    context 'when accessed with infrastracture_id' do
      let(:get_new){get :new, infrastructure_id: infrastructure.id}

      it 'should assign severspec with infrastracture_id' do
        expect(assigns(:serverspec).infrastructure_id).to_not be_nil
      end
    end
  end # end of describe #new

  describe 'GET #show' do
    let(:serverspec){create(:serverspec)}

    before do
      get :show, id: serverspec.id
    end

    context 'when accessed show' do
      it 'should render text server.value' do
        expect(response.body).to eq serverspec.value
      end
    end
  end

  describe 'POST #create' do
    let(:infrastructure_id){nil}
    let(:create_request){post :create, serverspec: serverspec}

    context 'when valid params' do
      before do
        create_request
      end

      it 'should assign a new serverspec and save' do
        expect(assigns(:serverspec)).to be_a(Serverspec)
        expect(assigns(:serverspec)).to be_persisted
      end

      it 'should redirect to serverspacs_path with infra_id false' do
        expect(response).to redirect_to(serverspecs_path(infrastructure_id: assigns(:serverspec).infrastructure_id))
      end

      context 'when infrastructure_id true' do
        let(:infrastructure_id){infrastructure.id}

        it 'serverspce.infra_id should not be nil' do
          expect(assigns(:serverspec).infrastructure_id).to eq(infrastructure_id)
        end
      end

      context 'when infrastructure_id false' do
        it 'serverspec.infra_id should be nil' do
          expect(assigns(:serverspec).infrastructure_id).to be_nil
        end
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Serverspec).to receive(:save).and_return(false)
        create_request
      end

      it 'should not save' do
        expect(assigns(:serverspec)).not_to be_persisted
      end

      it 'should render #new' do
        expect(response).to render_template :new
      end
    end
  end # end of describe post #create

  describe 'PATCH #update' do
    let(:new_serverspec){create(:serverspec)}
    let(:infrastructure_id){nil}
    let(:update_request){s = serverspec.dup; s.delete(:infrastructure_id); patch :update, id: new_serverspec.id, serverspec: s}

    context 'when valid params' do
      before do
        update_request
      end

      it 'should update finely' do
        s = Serverspec.find(new_serverspec.id)
        expect(s.name).to eq(svrsp_name)
        expect(s.description).to eq(svrsp_desc)
        expect(s.value).to eq(svrsp_value)
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Serverspec).to receive(:update).and_return(false)
        update_request
      end

      it 'should render edit' do
        expect(response).to render_template :edit
      end
    end
  end # end of patch #update

  describe 'DELETE #destroy' do
    let(:new_serverspec){create(:serverspec)}
    let(:delete_request){delete :destroy, id: new_serverspec.id}

    before do
      delete_request
    end

    subject{Serverspec.find(new_serverspec.id)}

    context 'when serverspec is deleted' do
      it 'should raise an error' do
        expect{subject}.to raise_error ActiveRecord::RecordNotFound
      end

      it 'should redirect' do
        infra_id = new_serverspec.infrastructure_id
        expect(response).to redirect_to(serverspecs_path(infrastructure_id: infra_id))
      end
    end
  end #end of delete # destroy

  describe '#select' do
    shared_context 'get_page' do |bool|
      let(:infra){create(:infrastructure)}
      let(:specs){create_list(:serverspec, 3, infrastructure: infra)}

      before do
        specs
        node = double(have_auto_generated: bool)
        allow(node).to receive(:details).and_return({'normal' => {'dish_id' => 0}})
        allow(Node).to receive(:new).and_return(node)
      end

      before do
        get :select, physical_id: 'i-hogehoge', infra_id: infra.id
      end

      should_be_success

      subject {response}

      it 'render serverspecs/_select' do
        is_expected.to render_template('serverspecs/select')
      end

      it 'assigns @individual_serverspecs' do
        expect(assigns[:individual_serverspecs]).to match_array(specs)
      end

      it 'assigns @global_serverspecs' do
        expect(assigns[:global_serverspecs]).to match_array([])
      end
    end

    context 'when have auto_generated' do
      include_context 'get_page', true

      it 'assigns @is_available_auto_generated' do
        expect(assigns[:is_available_auto_generated]).to be_truthy
      end
    end

    context 'when not have auto_generated' do
      include_context 'get_page', false

      it 'assigns @is_available_auto_generated' do
        expect(assigns[:is_available_auto_generated]).to be_falsey
      end
    end
  end

  describe "#create_for_rds" do
    let(:infra_id){infrastructure.id}
    let(:physical_id){"i-abcd1234"}
    let(:username){"username"}
    let(:password){"password"}
    let(:database){"MyDatabase"}
    let(:rds){double(:rds)}

    let(:request_createrds){put :create_for_rds, infra_id: infrastructure.id, physical_id: physical_id, username: username, password: password, database: database}

    before do
      allow(RDS).to receive(:new).with(infrastructure, physical_id).and_return(rds)
      expect(Serverspec).to receive(:create_rds).with(rds, username, password, infra_id.to_s, database)
      request_createrds
    end

    subject{Infrastructure.find(infra_id) }

    it "should find infra by infra_id" do
      expect(subject).to eq(infrastructure)
    end

    it "should be success" do
      expect(response).to be_success
    end
  end
end
