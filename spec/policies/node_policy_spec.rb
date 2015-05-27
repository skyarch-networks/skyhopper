#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe NodePolicy do
  subject{described_class}

  let(:master_admin){build_stubbed(:user, master: true,  admin: true)}
  let(:master){      build_stubbed(:user, master: true,  admin: false)}
  let(:admin){       build_stubbed(:user, master: false, admin: true)}
  let(:normal){      build_stubbed(:user, master: false, admin: false)}

  let(:infra){build_stubbed(:infrastructure)}

  %i[show?].each do |action|
    permissions action do
      context 'when allowed user' do
        before do
          admin.projects  = [infra.project]
          normal.projects = [infra.project]
        end

        it 'should grant' do
          [master_admin, master, admin, normal].each do |user|
            is_expected.to permit(user, infra)
          end
        end
      end

      context 'when not allowed user' do
        it 'should deny' do
          [admin, normal].each do |user|
            is_expected.not_to permit(user, infra)
          end
        end
      end
    end
  end

  %i[run_bootstrap? edit? update? cook? apply_dish? update_attributes? edit_attributes? yum_update?].each do |action|
    permissions action do
      context 'when allowed user' do
        before do
          admin.projects  = [infra.project]
          normal.projects = [infra.project]
        end

        it 'should grant only admin user' do
          is_expected.to     permit(master_admin, infra)
          is_expected.to     permit(admin,        infra)
          is_expected.not_to permit(master,       infra)
          is_expected.not_to permit(normal,       infra)
        end
      end

      context 'when not allowed user' do
        it 'should deny' do
          [admin, normal].each do |user|
            is_expected.not_to permit(user, infra)
          end
        end
      end
    end
  end

  %i[recipes?].each do |action|
    permissions action do
      it 'grants allways' do
        [master_admin, master, admin, normal].each do |user|
          is_expected.to permit(user, infra)
        end
      end
    end
  end
end
