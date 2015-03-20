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

  describe '#attr_slash_to_hash' do
    let(:slash){{'yum_releasever/releasever' => '2014.09', 'zabbix/agent/servers' => 'example.com'}}
    subject{node.attr_slash_to_hash(slash)}
    it do
      is_expected.to eq({
        'yum_releasever' => {
          'releasever' => '2014.09',
        },
        'zabbix' => {
          'agent' => {
            'servers' => ['example.com']
          }
        }
      })
    end
  end
end
