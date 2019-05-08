#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ProjectParameterPolicy do
  subject { described_class }
  let(:project) { build(:project) }

  permissions :show? do
    let(:allowed_user) { build(:user, master: false, admin: false, projects: [project]) }
    let(:master_user) { build(:user, master: true, admin: false) }

    it 'grants access allowed user' do
      is_expected.to permit(allowed_user, project)
      is_expected.to permit(master_user, project)
    end

    let(:denied_user) { build(:user, master: false, admin: false, projects: []) }

    it 'should deny' do
      is_expected.not_to permit(denied_user, project)
    end
  end

  permissions :update? do
    let(:admin_user) { build(:user, master: true, admin: true) }
    let(:not_admin_user) { build(:user, master: true, admin: false) }

    it 'grants only admin user' do
      is_expected.to permit(admin_user, project)
      is_expected.not_to permit(not_admin_user, project)
    end
  end
end
