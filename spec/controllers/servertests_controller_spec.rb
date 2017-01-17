#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ServertestsController, type: :controller do
  login_user
  let(:infrastructure){create(:infrastructure)}
  let(:svrsp_name){'name'}
  let(:svrsp_desc){'description'}
  let(:svrsp_value){'value'}
  let(:svrsp_category){'category'}
  let(:servertest){attributes_for(:servertest, name: svrsp_name, description: svrsp_desc, value: svrsp_value, infrastructure_id: infrastructure_id, category: :serverspec)}

  describe '#index' do
    let(:req){get :index, infrastructure_id: infrastructure.id}

    before do
      create_list(:servertest, 3, infrastructure_id: infrastructure.id)
      req
    end

    it 'should assign @servertest' do
      expect(assigns[:servertests]).to be_all{|servertest|servertest.kind_of?(Servertest)}
    end

    context 'when accessed index without infrastructure id' do
      let(:infrastructure){double("dummy", id: nil)}

      it 'should render index' do
        expect(response).to render_template :index
      end

      it 'infrastructure name should be nil' do
        expect(assigns[:infrastructure_name]).to be_nil
      end
    end

    context 'when accessed index with infrastructure id' do
      it 'infrastructure name should not be nil' do
        expect(assigns[:infrastructure_name]).to eq infrastructure.stack_name
      end

      it 'should assign @servertests where infra id = infra.id(from url)' do
        expect(assigns[:servertests]).to be_all{|servertest|servertest.infrastructure_id == infrastructure.id}
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

      xit 'servertest.value should be pre-set' do
        expect(assigns(:servertest).value).to eq("require 'serverspec_helper'\n\n")
      end
    end

    context 'when accessed without infrastructure_id' do
      it 'should assign servertest without infrastracture_id' do
        expect(assigns(:servertest).infrastructure_id).to be_nil
      end
    end

    context 'when accessed with infrastracture_id' do
      let(:get_new){get :new, infrastructure_id: infrastructure.id}

      it 'should assign severspec with infrastracture_id' do
        expect(assigns(:servertest).infrastructure_id).to_not be_nil
      end
    end
  end # end of describe #new

  describe 'GET #show' do
    let(:servertest){create(:servertest)}

    before do
      get :show, id: servertest.id
    end

    context 'when accessed show' do
      it 'should render text server.value' do
        expect(response.body).to eq servertest.value
      end
    end
  end

  describe 'POST #create' do
    let(:infrastructure_id){nil}
    let(:create_request){post :create, servertest: servertest}

    context 'when valid params' do
      before do
        create_request
      end

      it 'should assign a new servertest and save' do
        expect(assigns(:servertest)).to be_a(Servertest)
        expect(assigns(:servertest)).to be_persisted
      end

      it 'should redirect to servertests_path with infra_id false' do
        expect(response).to redirect_to(servertests_path(infrastructure_id: assigns(:servertest).infrastructure_id))
      end

      context 'when infrastructure_id true' do
        let(:infrastructure_id){infrastructure.id}

        it 'serverspec.infra_id should not be nil' do
          expect(assigns(:servertest).infrastructure_id).to eq(infrastructure_id)
        end
      end

      context 'when infrastructure_id false' do
        it 'servertest.infra_id should be nil' do
          expect(assigns(:servertest).infrastructure_id).to be_nil
        end
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Servertest).to receive(:save!).and_raise
        create_request
      end

      it 'should not save' do
        expect(assigns(:servertest)).not_to be_persisted
      end

      it 'should render #new' do
        expect(response).to render_template :new
      end
    end
  end # end of describe post #create

  describe 'PATCH #update' do
    let(:new_serverspec){create(:servertest)}
    let(:infrastructure_id){nil}
    let(:update_request){s = servertest.dup; s.delete(:infrastructure_id); patch :update, id: new_serverspec.id, servertest: s}

    context 'when valid params' do
      before do
        update_request
      end

      it 'should update finely' do
        s = Servertest.find(new_serverspec.id)
        expect(s.name).to eq(svrsp_name)
        expect(s.description).to eq(svrsp_desc)
        expect(s.value).to eq(svrsp_value)
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Servertest).to receive(:update).and_return(false)
        update_request
      end

      it 'should render edit' do
        expect(response).to render_template :edit
      end
    end
  end # end of patch #update

  describe 'GET #generator' do
    let(:req){get :generator}
    before{req}

    context 'when have infra id' do
      let(:infra){create(:infrastructure)}
      let(:req){get :generator, infrastructure_id: infra.id}

      should_be_success
      it 'should assign @infra' do
        expect(assigns[:infra]).to eq infra
      end
    end

    context 'when not have infra id' do
      should_be_success
      it 'should not assign @infra' do
        expect(assigns[:infra]).to be_nil
      end
    end
  end

  describe 'DELETE #destroy' do
    let(:new_serverspec){create(:servertest)}
    let(:delete_request){delete :destroy, id: new_serverspec.id}

    before do
      delete_request
    end

    subject{Servertest.find(new_serverspec.id)}

    context 'when servertest is deleted' do
      it 'should raise an error' do
        expect{subject}.to raise_error ActiveRecord::RecordNotFound
      end

      it 'should redirect' do
        infra_id = new_serverspec.infrastructure_id
        expect(response).to redirect_to(servertests_path(infrastructure_id: infra_id))
      end
    end
  end #end of delete # destroy

  describe '#select' do
    shared_context 'get_page' do |bool|
      let(:infra){create(:infrastructure)}
      let(:specs){create_list(:servertest, 3, infrastructure: infra, category: 1)}
      let(:physical_id){SecureRandom.base64(10)}
      let(:dish){create(:dish, servertests: [create(:servertest)])}
      let(:resource){create(:resource, physical_id: physical_id, dish: dish, infrastructure: infra, servertests: [create(:servertest)])}

      before do
        specs
        resource
        node = double(have_auto_generated: bool)
        allow(Node).to receive(:new).and_return(node)
      end

      before do
        get :select, physical_id: physical_id, infra_id: infra.id
      end

      should_be_success

      subject {response}

      it 'render servertests/_select' do
        is_expected.to render_template('servertests/select')
      end

      it 'should assign @selected_serverspec_ids' do
        expect(assigns[:selected_servertest_ids]).to match_array(dish.servertest_ids | resource.servertest_ids)
      end

      it 'assigns @individual_servertests' do
        expect(assigns[:individual_servertests]).to match_array(specs)
      end

      it 'assigns @global_servertests' do
        expect(assigns[:global_servertests]).to match_array([])
      end

      it 'assigns @servertest_schedule' do
        expect(assigns[:servertest_schedule]).to be_a ServertestSchedule
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

  describe '#results' do
    let(:specs){create_list(:servertest, 3, infrastructure: infrastructure)}
    let(:physical_id){SecureRandom.base64(10)}
    let(:resource){create(:resource, physical_id: physical_id, infrastructure: infrastructure, servertests: specs)}

    before do
      resource # exec create resource
      create(:servertest_result, servertests: specs, resource: resource)
      get :results, physical_id: physical_id, infra_id: infrastructure.id, format: 'json' # send HTTP request
    end

    should_be_success

    it 'should assign @servertest_results' do
      expect(assigns[:servertest_results]).to eq resource.servertest_results
    end
  end

  describe '#run_serverspec' do
    let(:infra){create(:infrastructure)}
    let(:physical_id){SecureRandom.base64(10)}
    let(:servertests){create_list(:servertest, 3)}
    let(:resource){create(:resource, physical_id: physical_id, infrastructure: infra)}
    let(:servertest_ids){servertests.map(&:id)}
    let(:failure_count){0}
    let(:pending_count){0}
    let(:status_text){'success'}
    let(:resp){{
      examples: [{status: 'pending', full_description: 'hogefuga'}],
      status: true,
      status_text: status_text,
    }}
    let(:req){post :run_serverspec, physical_id: physical_id, infra_id: infra.id, servertest_ids: servertest_ids}

    before do
      resource
      allow(ServertestJob).to receive(:perform_now).and_return(resp)
    end

    context 'when selected auto generated' do
      let(:servertest_ids){servertests.map(&:id).push('-1')}

      it 'should call run_serverspec with auto generated flag true' do
        expect(ServertestJob).to receive(:perform_now).with(
          physical_id, infra.id.to_param, kind_of(Integer),
          servertest_ids: servertests.map{|x|x.id.to_s}, auto_generated: true
        )
        req
      end
    end

    context 'when not selected auto generated' do
      it 'should call run_serverspec with auto generated flag false' do
        expect(ServertestJob).to receive(:perform_now).with(
          physical_id, infra.id.to_param, kind_of(Integer),
          servertest_ids: servertests.map{|x|x.id.to_s}, auto_generated: false
        )
        req
      end
    end

    context 'when Servertest command is failed' do
      let(:err_msg){'This is Error <3'}
      before do
        allow(ServertestJob).to receive(:perform_now).and_raise(err_msg)
        req
      end
      should_be_failure

      it 'should render message' do
        expect(response.body).to eq err_msg
      end
    end

    context 'when servertest result is fail' do
      let(:status_text){'failed'}
      before{req}
      should_be_success
    end

    context 'when servertest result is pending' do
      let(:status_text){'pending'}
      before{req}
      should_be_success
    end

    context 'when servertest result is success' do
      let(:status_text){'success'}
      before{req}
      should_be_success
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
      expect(Servertest).to receive(:create_rds).with(rds, username, password, infra_id.to_s, database)
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

  describe "#schedule" do
    let(:servertest_schedule) { create(:servertest_schedule) }
    let(:physical_id) { servertest_schedule.physical_id }
    let(:infra_id) { infrastructure.id }
    let(:schedule) { attributes_for(:servertest_schedule) }
    let(:req){post(:schedule, {physical_id: physical_id, infra_id: infra_id, schedule: schedule})}

    before do
      allow(Sidekiq::ScheduledSet).to receive_message_chain(:new, :select).and_return([])
    end

    context "when enabled" do
      before do
        expect(PeriodicServerspecJob).to receive_message_chain(:set, :perform_later)
        req
      end

      should_be_success
    end

    context "when disabled" do
      before do
        schedule[:enabled] = false
        req
      end

      should_be_success
    end
  end
end
