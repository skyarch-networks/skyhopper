#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
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

      it 'should not be "master"'do
        prj.code = 'master'
        expect(prj.save).to be false
      end

      it 'should not end "-read"' do
        prj.code = 'hoge-read'
        expect(prj.save).to be false
      end

      it 'should not end "-read-wirte"' do
        prj.code = 'fuga-read-write'
        expect(prj.save).to be false
      end
    end
  end
end
