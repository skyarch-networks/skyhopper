#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe MonitoringPolicy do
  subject { described_class }

  let(:master_admin) { create(:user, master: true, admin: true) }
  let(:master) { create(:user, master: true,  admin: false) }
  let(:admin) { create(:user, master: false, admin: true) }
  let(:normal) { create(:user, master: false, admin: false) }

  let(:infra) { create(:infrastructure) }

  %i[edit? update? create_host?].each do |action|
    permissions action do
      context 'when allowed user' do
        before do
          admin.projects  = [infra.project]
          normal.projects = [infra.project]
        end

        it 'grants admin user' do
          is_expected.to permit(admin,        infra)
          is_expected.to permit(master_admin, infra)
        end

        it 'denies not admin user' do
          is_expected.not_to permit(normal, infra)
          is_expected.not_to permit(master, infra)
        end
      end

      context 'when not allowed user' do
        it 'denes' do
          is_expected.not_to permit(admin, infra)
          is_expected.not_to permit(normal, infra)
        end
      end
    end
  end

  %i[show? show_cloudwatch_graph? show_zabbix_graph? show_problems? show_url_status?].each do |action|
    permissions action do
      context 'when allowed user' do
        before do
          admin.projects = [infra.project]
          normal.projects = [infra.project]
        end

        it 'grants' do
          is_expected.to permit(master_admin, infra)
          is_expected.to permit(master,       infra)
          is_expected.to permit(admin,        infra)
          is_expected.to permit(normal,       infra)
        end
      end

      context 'when not allowed user' do
        it 'denies' do
          is_expected.not_to permit(admin,  infra)
          is_expected.not_to permit(normal, infra)
        end
      end
    end
  end
end
