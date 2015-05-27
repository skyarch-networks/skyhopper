#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe User, :type => :model do
  let(:klass){User}
  let(:user){create(:user, master: false)}

  describe '#allow?' do
    context 'when receive project' do
      let(:project){create(:project)}
      subject{user.allow?(project)}

      context 'when not allow' do
        it do
          expect(subject).to be false
        end
      end

      context 'when allow' do
        before do
          create(:user_project, user: user, project: project)
        end

        it do
          expect(subject).to be true
        end
      end
    end

    context 'when receive infra' do
      let(:infra){create(:infrastructure)}
      subject{user.allow?(infra)}

      context 'when not allow' do
        it do
          expect(subject).to be false
        end
      end

      context 'when allow' do
        before do
          create(:user_project, user: user, project: infra.project)
        end

        it do
          expect(subject).to be true
        end
      end
    end
  end

  describe '#create_project' do
    let(:client){create(:client)}

    subject{user.create_project(client)}

    it do
      expect(subject).to be_a Project
    end

    it 'should created project' do
      subject
      expect(user.projects).not_to be_empty
    end
  end
end
