require_relative '../spec_helper'

describe ApplicationController do
  describe '#_with_zabbix' do
    controller do
      before_action do
        _with_zabbix do
          render text: 'fail!!', status: 400
        end
      end
      def index
        render text: 'success!'
      end
    end

    let(:req){get :index}

    context 'when zabbix server running' do
      run_zabbix_server

      should_be_success
    end

    context 'when zabbix server not running' do
      let(:state){double('server-state', is_running?: false)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        req
      end

      should_be_failure
    end
  end

  describe '#with_zabbix_or_render' do
    controller do
      before_action :with_zabbix_or_render
      def index;end
    end

    let(:req){get :index}

    context 'when zabbix server not running' do
      let(:state){double('server-state', is_running?: false)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        req
      end

      should_be_failure
    end
  end

  describe '#with_zabbix_or_back' do
    controller do
      before_action :with_zabbix_or_back
      def index;end
    end

    let(:req){request.env['HTTP_REFERER'] = 'http://example.com/hoge'; get :index}

    context 'when zabbix server not running' do
      let(:state){double('server-state', is_running?: false)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        req
      end

      it{is_expected.to redirect_to :back}
    end
  end
end
