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
  let(:physical_id){'i-SD2sc-sdWW-Test'}

  describe "GET #show" do
    let(:request_show){get :show, id: physical_id, format: 'json'}
    let(:body){JSON.parse(response.body, symbolize_names: true)}
    before do
      expect(Client).not_to be_exists(id: client.id)
    end

    it "returns json success" do
      request_show
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #create" do
    it "returns http success" do
      get :create
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #show_icalendar" do
    it "returns http success" do
      get :show_icalendar
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET #upload_icalendar" do
    it "returns http success" do
      get :upload_icalendar
      expect(response).to have_http_status(:success)
    end
  end

end
