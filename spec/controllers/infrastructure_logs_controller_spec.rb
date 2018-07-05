#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe InfrastructureLogsController, type: :controller do
  login_user

  describe '#index' do
    before do
      get :index, infrastructure_id: 1
    end

    should_be_success
  end

  describe '#sort_key' do
    controller InfrastructureLogsController do
      def index
        @result = sort_key
        render nothing: true
      end
    end

    context 'params[:sort_key] is nil' do
      before do
        get :index
      end

      it 'return default sort_key' do
        expect(assigns(:result)).to eq 'infrastructure_logs.created_at'
      end
    end

    context 'params[:sort_key] is invalid' do
      before do
        get :index, sort_key: 'xxx'
      end

      it 'return default sort_key' do
        expect(assigns(:result)).to eq 'infrastructure_logs.created_at'
      end
    end

    context 'params[:sort_key] is valid' do
      before do
        get :index, sort_key: 'users.email'
      end

      it 'return params[:sort_key]' do
        expect(assigns(:result)).to eq 'users.email'
      end
    end
  end

  describe '#order' do
    controller InfrastructureLogsController do
      def index
        @result = order
        render nothing: true
      end
    end

    context 'params[:sort_key] is nil and params[:order] is nil' do
      before do
        get :index
      end

      it 'return "DESC"' do
        expect(assigns(:result)).to eq 'DESC'
      end
    end

    context 'params[:sort_key] is not nil and params[:order] is nil' do
      before do
        get :index, sort_key: 'users.email'
      end

      it 'return "ASC"' do
        expect(assigns(:result)).to eq 'ASC'
      end
    end

    context 'params[:order] is invalid"' do
      before do
        get :index, order: "xxx"
      end

      it 'return "ASC"' do
        expect(assigns(:result)).to eq 'ASC'
      end
    end

    context 'params[:order] is "1"' do
      before do
        get :index, order: "1"
      end

      it 'return "ASC"' do
        expect(assigns(:result)).to eq 'ASC'
      end
    end

    context 'params[:order] is "-1"' do
      before do
        get :index, order: "-1"
      end

      it 'return "DESC"' do
        expect(assigns(:result)).to eq 'DESC'
      end
    end
  end
end
