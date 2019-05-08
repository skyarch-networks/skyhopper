#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe DishPolicy do
  subject { described_class }

  let(:master_admin) { build_stubbed(:user, master: true, admin: true) }
  let(:master) {      build_stubbed(:user, master: true,  admin: false) }
  let(:admin) {       build_stubbed(:user, master: false, admin: true) }
  let(:normal) {      build_stubbed(:user, master: false, admin: false) }

  let(:dish_without_project) { create(:dish, project: nil) }
  let(:dish_with_project) { create(:dish, project: create(:project)) }

  %i[show? index?].each do |action|
    permissions action do
      context 'when dish with project' do
        context 'when user allowed' do
          before do
            admin.projects  = [dish_with_project.project]
            normal.projects = [dish_with_project.project]
          end

          it 'should grant' do
            [master_admin, master, admin, normal].each do |user|
              is_expected.to permit(user, dish_with_project)
            end
          end
        end

        context 'when user not allowed' do
          it 'should deny' do
            [admin, normal].each do |user|
              is_expected.not_to permit(user, dish_with_project)
            end
          end
        end
      end

      context 'when dish without project' do
        it 'should grant all user' do
          [master_admin, master, admin, normal].each do |user|
            is_expected.to permit(user, dish_without_project)
          end
        end
      end
    end
  end

  %i[edit? update? new? create? destroy? validate?].each do |action|
    permissions action do
      context 'when dish with project' do
        context 'when user allowed' do
          before do
            admin.projects  = [dish_with_project.project]
            normal.projects = [dish_with_project.project]
          end

          it 'should grant only admin user' do
            is_expected.to     permit(master_admin, dish_with_project)
            is_expected.to     permit(admin,        dish_with_project)
            is_expected.not_to permit(master,       dish_with_project)
            is_expected.not_to permit(normal,       dish_with_project)
          end
        end

        context 'when user not allowed' do
          it 'should deny' do
            [admin, normal].each do |user|
              is_expected.not_to permit(user, dish_with_project)
            end
          end
        end
      end

      context 'when dish without project' do
        it 'should grant only admin user' do
          is_expected.to     permit(master_admin, dish_without_project)
          is_expected.to     permit(admin,        dish_without_project)
          is_expected.not_to permit(master,       dish_without_project)
          is_expected.not_to permit(normal,       dish_without_project)
        end
      end
    end
  end
end
