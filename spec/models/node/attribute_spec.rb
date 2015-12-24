#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper'

describe Node::Attribute do
  let(:physical_id){'i-hogefugapiyo'}
  let(:node){Node.new(physical_id)}

  describe '#get_attributes' do
    subject{node.get_attributes}
    let(:value){"dummy"}

    before do
      allow(node).to receive(:details).and_return(value)
    end

    it {is_expected.to be_a Hash}
    it do
      expect(subject.keys).to be_all{|x|x.is_a? Symbol}
    end
  end

  describe '#available_attributes' do
    subject{node.available_attributes}

    it {is_expected.to be_a Hash}
    it do
      expect(subject.keys).to be_all{|x|x.is_a? Symbol}
      expect(subject.values.map{|x|x[:type]}).to be_all{|x|x.is_a?(Class) || x==:Boolean}
      expect(subject.values.map{|x|x[:recipes]}).to be_all{|x|x.is_a? Array}
      expect(subject.values.map{|x|x[:description]}).to be_all{|x|x.is_a? String}
      expect(subject.values.map{|x|x[:required]}).to be_all{|x|x.nil? || x == true || x == false }
    end
  end

  describe '#attr_slash_to_hash' do
    let(:slash){{'yum_releasever/releasever' => '2014.09', 'zabbix/agent/servers' => 'example.com'}}
    subject{node.attr_slash_to_hash(slash)}
    it do
      is_expected.to eq({
        'yum_releasever' => {
          'releasever' => '2014.09'
        },
        'zabbix' => {
          'agent' => {
            'servers' => ['example.com']
          }
        },
      },)
    end
  end
end
