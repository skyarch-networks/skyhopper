#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe InfrastructurePolicy do
  subject{described_class}

  let(:master_admin){build_stubbed(:user, master: true,  admin: true)}
  let(:master){      build_stubbed(:user, master: true,  admin: false)}
  let(:admin){       build_stubbed(:user, master: false, admin: true)}
  let(:normal){      build_stubbed(:user, master: false, admin: false)}

  let(:infra){build_stubbed(:infrastructure)}

  %i[index? show? stack_events? show_rds? show_s3? show_elb?].each do |action|
    permissions action do
      context 'when allowed user' do
        before do
          admin.projects  = [infra.project]
          normal.projects = [infra.project]
        end

        it 'should grant' do
          is_expected.to permit(master_admin, infra)
          is_expected.to permit(master,       infra)
          is_expected.to permit(admin,        infra)
          is_expected.to permit(normal,       infra)
        end
      end

      context 'when not allowed user' do
        it 'should deny' do
          is_expected.not_to permit(admin,  infra)
          is_expected.not_to permit(normal, infra)
        end
      end
    end
  end

  %i[edit? update? destroy? delete_stack? change_rds_scale?].each do |action|
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
          is_expected.not_to permit(admin,  infra)
          is_expected.not_to permit(normal, infra)
        end
      end
    end
  end

  %i[new? create?].each do |action|
    permissions action do
      let(:infra){create(:infrastructure)}

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
          is_expected.not_to permit(admin,  infra)
          is_expected.not_to permit(normal, infra)
        end
      end

      context 'when client is for system' do
        before do
          allow_any_instance_of(Client).to receive(:is_for_system?).and_return(true)
        end

        it 'should deny' do
          is_expected.not_to permit(master_admin, infra)
          is_expected.not_to permit(admin,        infra)
          is_expected.not_to permit(master,       infra)
          is_expected.not_to permit(normal,       infra)
        end
      end
    end
  end
end
