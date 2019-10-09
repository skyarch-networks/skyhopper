#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe KeyPairPolicy do
  subject { described_class }

  let(:master_admin) { create(:user, master: true, admin: true) }
  let(:master) { create(:user, master: true, admin: false) }
  let(:admin) { create(:user, master: false, admin: true) }
  let(:normal) { create(:user, master: false, admin: false) }

  let(:project) { create(:project) }

  %i[index? retrieve?].each do |action|
    permissions action do
      context 'when allowed user' do
        before do
          admin.projects  = [project]
          normal.projects = [project]
        end

        it 'should grant' do
          [master_admin, master, admin, normal].each do |user|
            is_expected.to permit(user, project)
          end
        end
      end

      context 'when not allowed user' do
        it 'should deny' do
          [admin, normal].each do |user|
            is_expected.not_to permit(user, project)
          end
        end
      end
    end
  end

  %i[destroy?].each do |action|
    permissions action do
      context 'when allowed user' do
        before do
          admin.projects  = [project]
          normal.projects = [project]
        end

        it 'should grant only admin' do
          is_expected.to     permit(master_admin, project)
          is_expected.to     permit(admin,        project)
          is_expected.not_to permit(master,       project)
          is_expected.not_to permit(normal,       project)
        end
      end

      context 'when not allowed user' do
        it 'should deny' do
          [admin, normal].each do |user|
            is_expected.not_to permit(user, project)
          end
        end
      end
    end
  end
end
