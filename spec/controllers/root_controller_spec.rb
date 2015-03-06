#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe RootController, :type => :controller do
  let(:klass){RootController}
  let(:request){get :root}

  describe '#root' do
    context 'when setting is already set' do
      before do
        allow(AppSetting).to receive(:set?).and_return(false)
        request
      end

      it{is_expected.to redirect_to app_settings_path}
    end

    context 'when setting is not yet set' do
      before do
        allow(AppSetting).to receive(:set?).and_return(true)
      end

      context 'when master user' do
        login_user(master: true)

        it{request; is_expected.to redirect_to clients_path}
      end

      context 'when not master user' do
        login_user(master: false)
        it{request; is_expected.to redirect_to projects_path}
      end
    end
  end
end
