#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ClientPolicy do
  subject { described_class }

  let(:client) { build(:client) }
  let(:master_user) { build(:user, master: true, admin: false) }
  let(:admin_user) { build(:user, master: false, admin: true) }
  let(:normal_user) { build(:user, master: false, admin: false) }

  %i[index? show? create? new?].each do |action|
    permissions action do
      it 'grants access if user is a master' do
        is_expected.to permit(master_user, client)
      end

      it 'denies access if user is an admin' do
        is_expected.not_to permit(admin_user, client)
      end

      it 'denies access if user is not master' do
        is_expected.not_to permit(normal_user, client)
      end
    end
  end

  %i[update? edit? destroy?].each do |action|
    permissions action do
      it 'grants only master user' do
        is_expected.to     permit(master_user, client)
        is_expected.not_to permit(admin_user,  client)
        is_expected.not_to permit(normal_user, client)
      end

      context 'when client is for system' do
        before do
          allow(client).to receive(:is_for_system?).and_return(true)
        end
        it 'deny all user' do
          is_expected.not_to permit(master_user, client)
          is_expected.not_to permit(admin_user,  client)
          is_expected.not_to permit(normal_user, client)
        end
      end
    end
  end
end
