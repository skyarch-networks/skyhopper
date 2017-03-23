require 'rails_helper'

RSpec.describe OperationDurationsController, type: :controller do

  describe "GET #show" do
    it "returns http success" do
      get :show
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
