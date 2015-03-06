#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Client, :type => :model do
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
end
