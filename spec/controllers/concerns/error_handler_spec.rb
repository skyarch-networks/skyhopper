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
      rescue =>ex
        render text: 'rescue'
      end
    end

    let(:req){get :index, ex: ex}

    context 'when ajax' do
      request_as_ajax

      context 'when defined format_error' do
        class E < StandardError
          def format_error
            return {
              message: 'hoge',
              kind:    'fuga',
            }
          end
          def status_code
            return 500
          end
        end

        let(:ex){'E.new("hoge")'}
        before{req}

        should_be_failure

        it 'should render formated error' do
          expect(JSON.parse(response.body, symbolize_names: true)).to eq({error:{
            message: 'hoge',
            kind:    'fuga',
          }})
        end
      end

      context 'when not defined format_error' do
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
    end

    context 'when not ajax' do
      let(:ex){'StandardError.new("hoge")'}
      before{req}

      it 'should raise error' do
        expect(response.body).to eq 'rescue'
      end
    end
  end
end
