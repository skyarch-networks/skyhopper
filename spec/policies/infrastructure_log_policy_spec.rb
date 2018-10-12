#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe InfrastructureLogPolicy do
  subject{described_class}

  let(:master_admin){build_stubbed(:user, master: true,  admin: true)}
  let(:master){      build_stubbed(:user, master: true,  admin: false)}
  let(:admin){       build_stubbed(:user, master: false, admin: true)}
  let(:normal){      build_stubbed(:user, master: false, admin: false)}

  let(:infrastructure_log){build_stubbed(:infrastructure_log)}

  %i[index? download_all? download?].each do |action|
    permissions action do
      context 'when allowed user' do
        before do
          admin.projects  = [infrastructure_log.infrastructure.project]
          normal.projects = [infrastructure_log.infrastructure.project]
        end

        it 'should grant' do
          is_expected.to permit(master_admin, infrastructure_log)
          is_expected.to permit(master,       infrastructure_log)
          is_expected.to permit(admin,        infrastructure_log)
          is_expected.to permit(normal,       infrastructure_log)
        end
      end

      context 'when not allowed user' do
        it 'should deny' do
          is_expected.not_to permit(admin,  infrastructure_log)
          is_expected.not_to permit(normal, infrastructure_log)
        end
      end
    end
  end
end
