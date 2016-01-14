#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ProjectParameter, type: :model do
  let(:project){create(:project)}

  describe 'with validation' do
    describe 'project_id and key' do
      let(:key){'key'}
      it 'should be uniq'do
        _param1 = create(:project_parameter, project: project, key: key)
        param2  = build(:project_parameter, project: project, key: key)
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

  describe '.exec' do
    subject{ProjectParameter.exec(target, project: project)}

    context 'include no param' do
      let(:target){'hogehoge'}
      it {is_expected.to eq target}
    end

    context 'include one param, but project parameters does not exist' do
      let(:target){'${hoge}hoge'}
      it {is_expected.to eq target}
    end

    context 'include one param' do
      let(:target){"foo${foo}"}
      before do
        create(:project_parameter, key: 'foo', value: 'bar', project: project)
      end

      it {is_expected.to eq 'foobar'}
    end

    context 'include many params' do
      let(:target){"${foo}${bar}${baz}"}
      before do
        create(:project_parameter, key: 'foo', value: 'hoge', project: project)
        create(:project_parameter, key: 'bar', value: 'fuga', project: project)
        create(:project_parameter, key: 'baz', value: 'piyo', project: project)
      end

      it {is_expected.to eq 'hogefugapiyo'}
    end

    context 'include escaped param' do
      let(:target){'\${foo}'}
      before do
        create(:project_parameter, key: 'foo', value: 'hoge', project: project)
      end

      it {is_expected.to eq target}
    end
  end
end
