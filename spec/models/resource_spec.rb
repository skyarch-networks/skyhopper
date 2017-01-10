#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
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
end
