#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Client, type: :model do
  let(:klass) { Client }

  describe 'Client::FOR_SYSTEM_CODE_NAME ' do
    subject { klass::FOR_SYSTEM_CODE_NAME }
    it { is_expected.to eq 'SkyHopper' }
    it { is_expected.to be_frozen }
  end

  describe '.for_system' do
    subject { klass.for_system }
    it { is_expected.to eq klass.find_by(code: klass::FOR_SYSTEM_CODE_NAME) }
  end

  describe '#for_system?' do
    context 'when system client' do
      let(:client) { build(:client, code: klass::FOR_SYSTEM_CODE_NAME, name: klass::FOR_SYSTEM_CODE_NAME) }
      subject { client.for_system? }

      it { is_expected.to be true }
    end

    context 'when not system client' do
      let(:client) { build(:client) }
      subject { client.for_system? }

      it { is_expected.to be false }
    end
  end

  describe 'with restrict_with_error' do
    let(:client) { create :client }

    context 'when project has some infra' do
      before do
        client.projects = create_list :project, 3
        client.reload
      end

      it 'cant destroy' do
        expect { client.destroy }.to raise_error ActiveRecord::DeleteRestrictionError
        expect(Client).to be_exists client.id
      end
    end

    context 'when project does not have any inra' do
      it 'can destroy' do
        expect { client.destroy }.not_to raise_error
        expect(Client).not_to be_exists client.id
      end
    end
  end
end
