#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Project, type: :model do
  describe 'with validation' do
    describe 'column code' do
      let(:prj){build(:project)}

      it 'should not be "master"' do
        prj.code = 'master'
        expect(prj.save).to be false
      end

      it 'should not end "-read"' do
        prj.code = 'hoge-read'
        expect(prj.save).to be false
      end

      it 'should not end "-read-write"' do
        prj.code = 'fuga-read-write'
        expect(prj.save).to be false
      end
    end
  end

  describe 'with restrict_with_error' do
    stubize_zabbix
    let(:zabbix_server){create :zabbix_server}
    let(:project){create :project, zabbix_server_id: zabbix_server.id }

    context 'when project has some infra' do
      before do
        project.infrastructures = create_list :infrastructure, 3
        project.reload
      end

      it 'cant destroy' do
        expect{project.destroy}.to raise_error ActiveRecord::DeleteRestrictionError
        expect(Project).to be_exists project.id
      end
    end

    context 'when project does not have any inra' do
      it 'can destroy' do
        expect{project.destroy}.not_to raise_error
        expect(Project).not_to be_exists project.id
      end
    end
  end
end
