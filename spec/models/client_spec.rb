#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Client, type: :model do
  let(:klass){Client}

  describe 'Client::ForSystemCodeName ' do
    subject{klass::ForSystemCodeName}
    it{is_expected.to eq 'SkyHopper'}
    it{is_expected.to be_frozen}
  end

  describe '.for_system' do
    subject{klass.for_system}
    it{is_expected.to eq klass.find_by(code: klass::ForSystemCodeName)}
  end

  describe '#is_for_system?' do
    context 'when system client' do
      let(:client){build(:client, code: klass::ForSystemCodeName, name: klass::ForSystemCodeName)}
      subject{client.is_for_system?}

      it{is_expected.to be true}
    end

    context 'when not system client' do
      let(:client){build(:client)}
      subject{client.is_for_system?}

      it{is_expected.to be false}
    end
  end

  describe 'with restrict_with_error' do
    let(:client){create :client}

    context 'when project has some infra' do
      before do
        client.projects = create_list :project, 3
        client.reload
      end

      it 'cant destroy' do
        expect{client.destroy}.to raise_error ActiveRecord::DeleteRestrictionError
        expect(Client).to be_exists client.id
      end
    end

    context 'when project does not have any inra' do
      it 'can destroy' do
        expect{client.destroy}.not_to raise_error
        expect(Client).not_to be_exists client.id
      end
    end
  end
end
