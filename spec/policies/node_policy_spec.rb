#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
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

  %i[apply_dish? yum_update? run_ansible_playbook? edit_ansible_playbook? update_ansible_playbook?].each do |action|
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
end
