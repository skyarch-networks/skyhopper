#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

RSpec.describe Resource, :type => :model do
  describe '#all_serverspecs' do
    subject{resource.all_serverspecs}

    context 'when have dish' do
      let(:dish){build_stubbed(:dish, serverspecs: [build_stubbed(:serverspec)])}
      # XXX: これとか FactoryGirl で定義したい
      let(:resource){build_stubbed(:resource, dish: dish, serverspecs: [build_stubbed(:serverspec)])}

      it {is_expected.to match_array resource.serverspecs | resource.dish.serverspecs}
    end

    context 'when not have dish' do
      let(:resource){build_stubbed(:resource, serverspecs: [build_stubbed(:serverspec)])}
      it {is_expected.to match_array resource.serverspecs}
    end
  end

  describe '#all_serverspec_ids' do
    subject{resource.all_serverspec_ids}

    context 'when have dish' do
      let(:dish){build_stubbed(:dish, serverspecs: [build_stubbed(:serverspec)])}
      let(:resource){build_stubbed(:resource, dish: dish, serverspecs: [build_stubbed(:serverspec)])}

      it {is_expected.to match_array resource.serverspec_ids | resource.dish.serverspec_ids}
    end

    context 'when not have dish' do
      let(:resource){build_stubbed(:resource, serverspecs: [build_stubbed(:serverspec)])}

      it {is_expected.to match_array resource.serverspec_ids}
    end
  end
end
