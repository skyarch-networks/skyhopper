#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe UserPolicy do
  subject{described_class}

  let(:user){build(:user)}
  let(:master_user){build(:user, master: true,  admin: false)}
  let(:admin_user) {build(:user, master: false, admin: true)}
  let(:normal_user){build(:user, master: false, admin: false)}

  %i[index? create? new? update? edit? destroy? sync_zabbix?].each do |action|
    permissions action do
      it 'grants access if user is a master' do
        is_expected.to permit(master_user, user)
      end

      it 'denies access if user is an admin' do
        is_expected.not_to permit(admin_user, user)
      end

      it 'denies access if user is not master' do
        is_expected.not_to permit(normal_user, user)
      end
    end
  end
end
