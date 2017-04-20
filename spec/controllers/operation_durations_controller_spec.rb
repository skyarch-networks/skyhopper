#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe OperationDurationsController, type: :controller do
  login_user
  let(:infra){create(:infrastructure)}
  let(:resource){create(:resource)}

  describe "GET #show" do
    let(:request_show){get :show, id: infra.id, physical_id: resource.physical_id}
    before do
      allow(Resource).to receive(:find) {resource}
      allow(Resource).to receive(:operation_durations).and_return(resource)
      request_show
    end

    context 'when valid parameters' do
      it 'should assign @resource' do
        expect(assigns[:resource]).to eq resource
      end

      it 'should assign @operation_schedule' do
        expect(assigns[:operation_schedule]).to eq resource.operation_durations
      end
    end


  end

  describe "POST #create" do
    let(:req){post :create, id: infra.id, physical_id: resource.physical_id}
    let(:operation){create(:operation_duration)}

    before do
      allow(OperationDuration).to receive(:find).and_return(operation)
      req
    end

    it "returns http success" do
      get :create
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #show_icalendar" do
    xit "returns http success" do
      get :show_icalendar
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #upload_icalendar" do
    xit "returns http success" do
      get :upload_icalendar
      expect(response).to have_http_status(:success)
    end
  end

end
