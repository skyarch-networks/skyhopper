#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ServertestPolicy do
  subject { described_class }

  let(:master_admin) { create(:user, master: true, admin: true) }
  let(:master) { create(:user, master: true, admin: false) }
  let(:admin) { create(:user, master: false, admin: true) }
  let(:normal) { create(:user, master: false, admin: false) }

  let(:servertest_with_infra) { create(:servertest) }
  let(:serverspec_without_infra) { create(:servertest, infrastructure: nil) }

  %i[index? show?].each do |action|
    permissions action do
      context 'servertest has infra' do
        it 'should grant allowed user' do
          is_expected.not_to permit(normal, servertest_with_infra)

          normal.projects = [servertest_with_infra.infrastructure.project]
          is_expected.to permit(normal, servertest_with_infra)
        end
      end

      context "servertest doesn't have infra" do
        it 'should grant all user' do
          is_expected.to permit(master_admin, serverspec_without_infra)
          is_expected.to permit(master,       serverspec_without_infra)
          is_expected.to permit(admin,        serverspec_without_infra)
          is_expected.to permit(normal,       serverspec_without_infra)
        end
      end
    end
  end

  %i[new? update? create? edit? destroy? select? run_serverspec? create_for_rds? schedule?].each do |action|
    permissions action do
      context 'servertest has infra' do
        it 'should grant allowed user' do
          is_expected.not_to permit(admin, servertest_with_infra)

          admin.projects = [servertest_with_infra.infrastructure.project]
          is_expected.to permit(admin, servertest_with_infra)
        end

        it 'should deny not admin user' do
          normal.projects = [servertest_with_infra.infrastructure.project]
          is_expected.not_to permit(normal, servertest_with_infra)
          master.projects = [servertest_with_infra.infrastructure.project]
          is_expected.not_to permit(master, servertest_with_infra)
        end
      end

      context "servertest doesn't have infra" do
        it 'should grant only master and admin user' do
          is_expected.to     permit(master_admin, serverspec_without_infra)
          is_expected.not_to permit(master,       serverspec_without_infra)
          is_expected.not_to permit(admin,        serverspec_without_infra)
          is_expected.not_to permit(normal,       serverspec_without_infra)
        end
      end
    end
  end
end
