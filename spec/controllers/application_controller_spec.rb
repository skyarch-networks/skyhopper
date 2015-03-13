require_relative '../spec_helper'

describe ApplicationController do
  describe '#with_zabbix' do
    controller do
      before_action :with_zabbix
      def index
        render text: 'success!'
      end
    end

    let(:req){get :index}

    context 'when zabbix server running' do
      let(:state){double('server-state', is_running?: true)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        req
      end

      should_be_success
    end

    context 'when zabbix server not running' do
      let(:state){double('server-state', is_running?: false)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        req
      end

      should_be_failure

      it {expect(response.body).to eq I18n.t('monitoring.msg.not_running')}

    end

    context 'when zabbix server not running and with block' do
      controller do
        before_action do
          with_zabbix do
            redirect_to '/'
          end
        end

        def show
          render 'should not show this message!'
        end
      end

      let(:state){double('server-state', is_running?: false)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        get :show, id: 1
      end

      it{is_expected.to redirect_to '/'}
    end
  end
end
