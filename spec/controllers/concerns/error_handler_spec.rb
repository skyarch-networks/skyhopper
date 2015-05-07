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
    let(:req){get :index}

    context 'when ajax' do
      request_as_ajax
      before{req}
      it do
        expect(assigns[:ajax]).to be true
      end
    end

    context 'when not ajax' do
      before{req}
      it do
        expect(assigns[:ajax]).to be false
      end
    end
  end

  describe '#rescue_exception' do

  end
end
