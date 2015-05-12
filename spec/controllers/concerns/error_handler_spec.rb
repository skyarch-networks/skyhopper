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
    controller do
      include Concerns::ErrorHandler
      def index
        rescue_exception(eval(params[:ex])) and return
      end
    end

    let(:req){get :index, ex: ex}

    context 'when ajax' do
      request_as_ajax

      let(:ex){'StandardError.new("Poyo")'}
      before{req}
      let(:err){JSON.parse(response.body, symbolize_names: true)[:error]}

      should_be_failure

      it 'message should Poyo' do
        expect(err[:message]).to eq 'Poyo'
      end

      it 'kind should StandardError' do
        expect(err[:kind]).to eq StandardError.to_s
      end
    end

    context 'when not ajax' do
      let(:ex){'StandardError.new("hoge")'}

      it 'should raise error' do
        expect{req}.to raise_error(StandardError)
      end
    end
  end
end
