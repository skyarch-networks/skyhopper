#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

describe Concerns::ControllerUtil do
  describe '#redirect_to_back_or_root' do
    controller do
      include Concerns::ControllerUtil
      def index
        redirect_to_back_or_root
      end
    end
    let(:req) { get :index }

    context 'when set referer' do
      let(:referer) { 'http://example.com' }
      before do
        request.env['HTTP_REFERER'] = referer
        req
      end

      it { is_expected.to redirect_to referer }
    end

    context 'when not set referer' do
      before { req }

      it { is_expected.to redirect_to root_path }
    end
  end
end
