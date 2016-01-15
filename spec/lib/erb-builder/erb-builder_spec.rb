#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper.rb'

describe ERB::Builder do
  let(:builder){ERB::Builder.new('presets/Simple_Pattern')}
  describe '.new' do
    it 'should not raise error' do
      builder
    end
  end

  describe '#build' do
    subject{builder.build}
    it {is_expected.to be_a String}

    it 'should be a JSON' do
      JSON.parse(subject)
    end
  end
end
