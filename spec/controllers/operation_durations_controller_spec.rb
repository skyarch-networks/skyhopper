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
  let(:start_date){Time.at(rand * Time.now.to_i)}
  let(:end_date){Time.at(rand * Time.now.to_i)}
  let(:end_time){Time.at(rand * Time.now.to_i)}
  let(:repeat_freq){'category'}
  let(:instance_params){attributes_for(:operation_duration, resource_id: resource.id, start_date: start_date, end_date: end_date, end_time: end_time, repeat_freq: :repeat_freq)}

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
    let(:req){post :create, id: infra.id, instance: instance_params}

    before do
      req
      allow(OperationDuration).to receive(:find).and_return(instance_params)
    end

    context 'with valid paramters' do
      it "it should assign schedule" do
        expect(response).to have_http_status(:success)
      end
    end

    context 'with invalud parameters' do
      before do
        post :create, id: infra.id, instance: nil
        allow(OperationDuration).to receive(:find).and_return(nil)
      end

      should_be_failure

      it 'should have an error message' do
        expect(response).to have_http_status(302)
      end
    end

  end

end
