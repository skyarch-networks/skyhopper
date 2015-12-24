#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ProjectParameter, type: :model do
  describe 'with validation' do
    describe 'project_id and key' do
      let(:project){create(:project)}
      let(:key){'key'}
      it 'should be uniq'do
        param1 = create(:project_parameter, project: project, key: key)
        param2 = build(:project_parameter, project: project, key: key)
        expect(param2.save).to be false
      end
    end

    describe 'key' do
      context 'valid' do
        it 'should success saving' do
          expect(build(:project_parameter).save).to be true
          expect(build(:project_parameter, key: 'foo').save).to be true
          expect(build(:project_parameter, key: 'foo2').save).to be true
        end
      end

      context 'invalid' do
        it 'should fail saving' do
          expect(build(:project_parameter, key: '2foo').save).to be false
          expect(build(:project_parameter, key: 'にゃーん').save).to be false
          expect(build(:project_parameter, key: '!!').save).to be false
        end
      end
    end
  end
end
