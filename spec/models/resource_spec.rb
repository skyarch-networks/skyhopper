#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

RSpec.describe Resource, type: :model do
  describe '#all_servertests' do
    subject{resource.all_servertests}

    context 'when have dish' do
      let(:dish){build_stubbed(:dish, servertests: [build_stubbed(:servertest)])}
      # XXX: これとか FactoryGirl で定義したい
      let(:resource){build_stubbed(:resource, dish: dish, servertests: [build_stubbed(:servertest)])}

      it {is_expected.to match_array resource.servertests | resource.dish.servertests}
    end

    context 'when not have dish' do
      let(:resource){build_stubbed(:resource, servertests: [build_stubbed(:servertest)])}
      it {is_expected.to match_array resource.servertests}
    end
  end

  describe '#all_servertest_ids' do
    subject{resource.all_servertest_ids}

    context 'when have dish' do
      let(:dish){build_stubbed(:dish, servertests: [build_stubbed(:servertest)])}
      let(:resource){build_stubbed(:resource, dish: dish, servertests: [build_stubbed(:servertest)])}

      it {is_expected.to match_array resource.servertest_ids | resource.dish.servertest_ids}
    end

    context 'when not have dish' do
      let(:resource){build_stubbed(:resource, servertests: [build_stubbed(:servertest)])}

      it {is_expected.to match_array resource.servertest_ids}
    end
  end

  describe '#get_playbook_roles' do
    subject{resource.get_playbook_roles}

    context 'when playbook_roles is nil' do
      let(:resource){build(:resource)}

      before do
        resource.playbook_roles = nil
      end

      it {is_expected.to eq []}
    end

    context 'when playbook_roles is \'["aaa", "bbb"]\'(JSON string)' do
      let(:resource){build(:resource)}

      before do
        resource.playbook_roles = '["aaa", "bbb"]'
      end

      it {is_expected.to eq ['aaa', 'bbb']}
    end
  end

  describe '#set_playbook_roles' do
    let(:resource){build(:resource)}

    context 'when argument playbook_roles is array' do
      before do
        resource.set_playbook_roles(['aaa', 'bbb'])
      end

      it 'playbook_roles is JSON text' do
        expect(resource.playbook_roles).to eq '["aaa","bbb"]'
      end
    end
  end

  describe '#get_extra_vars' do
    subject{resource.get_extra_vars}

    context 'when extra_vars is nil' do
      let(:resource){build(:resource)}

      before do
        resource.extra_vars = nil
      end

      it {is_expected.to eq '{}'}
    end

    context 'when playbook_roles is not nil' do
      let(:resource){build(:resource)}

      before do
        resource.extra_vars = '{"aaa":"abc"}'
      end

      it {is_expected.to eq '{"aaa":"abc"}'}
    end
  end
end
