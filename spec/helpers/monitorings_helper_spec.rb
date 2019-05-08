#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

# Specs in this file have access to a helper object that includes
# the MonitoringsHelper. For example:
#
# describe MonitoringsHelper do
#   describe "string concat" do
#     it "concats two strings with spaces" do
#       expect(helper.concat_strings("this","that")).to eq("this that")
#     end
#   end
# end
RSpec.describe MonitoringsHelper, type: :helper do
  describe '#url_settings' do
    subject { helper.url_settings }
    let(:url_settings) { %w[test test2] }

      it { is_expected.not_to be nil }
      it 'should be valid' do
        expect(url_settings).to include('test')
      end
  end
end
