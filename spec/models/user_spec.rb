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
  let(:user){build_stubbed(:user, master: false)}

  describe '#allow?' do
    context 'when receive project' do
      let(:project){build_stubbed(:project)}
      subject{user.allow?(project)}

      context 'when not allow' do
        it do
          expect(subject).to be false
        end
      end

      context 'when allow' do
        before do
          user.projects = [project]
        end

        it do
          expect(subject).to be true
        end
      end
    end

    context 'when receive infra' do
      let(:infra){build_stubbed(:infrastructure)}
      subject{user.allow?(infra)}

      context 'when not allow' do
        it do
          expect(subject).to be false
        end
      end

      context 'when allow' do
        before do
          user.projects = [infra.project]
        end

        it do
          expect(subject).to be true
        end
      end
    end
  end

  describe '#create_project' do
    let(:client){build_stubbed(:client)}

    subject{user.create_project(client)}

    it do
      expect(subject).to be_a Project
    end

    it 'should created project' do
      subject
      expect(user.projects).not_to be_empty
    end
  end

  describe '#trim_password' do
    subject{user.trim_password}
    it {is_expected.not_to be_include(:encrypted_password)}
    it {is_expected.not_to be_include(:mfa_secret_key)}
    it {is_expected.to be_a Hash}
    it {is_expected.to be_all{|key, _|key.is_a? Symbol}}
  end
end
