#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ServerspecPolicy do
  subject{described_class}

  let(:master_admin){build_stubbed(:user, master: true,  admin: true)}
  let(:master){      build_stubbed(:user, master: true,  admin: false)}
  let(:admin){       build_stubbed(:user, master: false, admin: true)}
  let(:normal){      build_stubbed(:user, master: false, admin: false)}

  let(:serverspec_with_infra){   build_stubbed(:serverspec)}
  let(:serverspec_without_infra){build_stubbed(:serverspec, infrastructure: nil)}


  %i[index? show?].each do |action|
    permissions action do
      context 'serverspec has infra' do
        it 'should grant allowed user' do
          is_expected.not_to permit(normal, serverspec_with_infra)

          normal.projects = [serverspec_with_infra.infrastructure.project]
          is_expected.to permit(normal, serverspec_with_infra)
        end
      end

      context "serverspec doesn't have infra" do
        it 'should grant all user' do
          is_expected.to permit(master_admin, serverspec_without_infra)
          is_expected.to permit(master,       serverspec_without_infra)
          is_expected.to permit(admin,        serverspec_without_infra)
          is_expected.to permit(normal,       serverspec_without_infra)
        end
      end
    end
  end

  %i[new? update? create? edit? destroy? select? run? create_for_rds? schedule?].each do |action|
    permissions action do
      context 'serverspec has infra' do
        it 'should grant allowed user' do
          is_expected.not_to permit(admin, serverspec_with_infra)

          admin.projects = [serverspec_with_infra.infrastructure.project]
          is_expected.to permit(admin, serverspec_with_infra)
        end

        it 'should deny not admin user' do
          normal.projects = [serverspec_with_infra.infrastructure.project]
          is_expected.not_to permit(normal, serverspec_with_infra)
          master.projects = [serverspec_with_infra.infrastructure.project]
          is_expected.not_to permit(master, serverspec_with_infra)
        end
      end

      context "serverspec doesn't have infra" do
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
