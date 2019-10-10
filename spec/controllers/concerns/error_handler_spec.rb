#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

describe Concerns::ErrorHandler do
  describe 'ajax?' do
    controller do
      include Concerns::ErrorHandler

      def index
        @ajax = ajax?
        render body: nil
      end
    end
    let(:req) { get :index }

    context 'when ajax' do
      request_as_ajax
      before { req }
      it do
        expect(assigns[:ajax]).to be true
      end
    end

    context 'when not ajax' do
      before { req }
      it do
        expect(assigns[:ajax]).to be false
      end
    end
  end

  describe '#rescue_exception' do
    controller ApplicationController do
      include Concerns::ErrorHandler
      def index
        rescue_exception(ex) and return
      end
    end

    let(:ex) { StandardError.new(error_msg) }
    let(:error_msg) { SecureRandom.hex(10) }
    before do
      allow_any_instance_of(ApplicationController).to receive(:ex).and_return(ex)
      allow(ex).to receive(:backtrace).and_return(['foo'])
    end
    let(:req) { get :index }

    context 'when ajax' do
      request_as_ajax

      before { req }
      let(:err) { JSON.parse(response.body, symbolize_names: true)[:error] }

      should_be_failure

      it 'message should set' do
        expect(err[:message]).to eq error_msg
      end

      it 'kind should StandardError' do
        expect(err[:kind]).to eq StandardError.to_s
      end
    end

    context 'when not ajax' do
      before { req }
      it { is_expected.to redirect_to root_path }
      it 'should set flash.alert' do
        expect(request.flash[:alert]).to eq error_msg
      end
    end
  end
end
