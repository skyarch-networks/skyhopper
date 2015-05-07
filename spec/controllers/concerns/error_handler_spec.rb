require_relative '../../spec_helper'

describe Concerns::ErrorHandler do
  describe 'ajax?' do
    controller do
      include Concerns::ErrorHandler

      def index
        @ajax = ajax?
        render nothing: true
      end
    end
    before{req}

    context 'when ajax' do
      let(:req){request.env['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest';get :index}

      it do
        expect(assigns[:ajax]).to be true
      end
    end

    context 'when not ajax' do
      let(:req){get :index}

      it do
        expect(assigns[:ajax]).to be false
      end
    end
  end
end
