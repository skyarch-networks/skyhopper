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
      get :index, params: { infrastructure_id: 1 }
    end

    should_be_success
  end

  describe 'download_all' do
    let(:infra) { create(:infrastructure) }
    let(:infrastructure_logs) { create_list(:infrastructure_log, 3, infrastructure: infra) }
    before do
      get :download_all, params: { infrastructure_id: infra.id }
    end

    should_be_success

    it 'should zip file download' do
      expect(response.header['Content-Disposition']).to match(/infrastrucure_logs-[0-9]{14}.zip/)
      expect(response.header['Content-Type']).to eq('application/zip')
    end
  end

  describe '#download' do
    let(:infrastructure_log) { create(:infrastructure_log) }
    before do
      get :download, params: { id: infrastructure_log.id }
    end

    should_be_success

    it 'should log file download' do
      expect(response.header['Content-Disposition']).to include(infrastructure_log.to_filename)
      expect(response.header['Content-Type']).to eq('application/octet-stream')
    end
  end

  describe '#get_infrastructure_logs' do
    let(:infra) { create(:infrastructure) }
    let(:infrastructure_logs) { create_list(:infrastructure_log, 3, infrastructure: infra) }

    controller InfrastructureLogsController do
      def index
        @result = get_infrastructure_logs
        render nothing: true
      end
    end

    it 'should return infrastructure_logs for specified infrastructure' do
      infrastructure_log_ids = infrastructure_logs.map(&:id)
      get :index, params: { infrastructure_id: infra.id }
      expect(assigns(:result).first.is_a?(InfrastructureLog)).to be_truthy
      expect(assigns(:result).ids).to eq infrastructure_log_ids
    end
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
        get :index, params: { sort_key: 'xxx' }
      end

      it 'return default sort_key' do
        expect(assigns(:result)).to eq 'infrastructure_logs.created_at'
      end
    end

    context 'params[:sort_key] is valid' do
      before do
        get :index, params: { sort_key: 'users.email' }
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
        get :index, params: { sort_key: 'users.email' }
      end

      it 'return "ASC"' do
        expect(assigns(:result)).to eq 'ASC'
      end
    end

    context 'params[:order] is invalid"' do
      before do
        get :index, params: { order: 'xxx' }
      end

      it 'return "ASC"' do
        expect(assigns(:result)).to eq 'ASC'
      end
    end

    context 'params[:order] is "1"' do
      before do
        get :index, params: { order: '1' }
      end

      it 'return "ASC"' do
        expect(assigns(:result)).to eq 'ASC'
      end
    end

    context 'params[:order] is "-1"' do
      before do
        get :index, params: { order: '-1' }
      end

      it 'return "DESC"' do
        expect(assigns(:result)).to eq 'DESC'
      end
    end
  end
end
