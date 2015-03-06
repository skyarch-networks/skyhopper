#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class EC2Instance
  # instance_types を取得するAPIがなさそう?
  Types = [
    'm3.medium', 'm3.large', 'm3.xlarge', 'm3.2xlarge',
    'c3.large', 'c3.xlarge', 'c3.2xlarge', '4xlarge', 'c3.8xlarge',
    'g2.2xlarge',
    'r3.large', 'r3.xlarge', 'r3.2xlarge', 'r3.4xlarge', 'r3.8xlarge',
    'i2.xlarge', 'i2.2xlarge', 'i2.4xlarge', 'hs1.8xlarge',
    't1.micro', 'm1.small'
  ].recursive_freeze
end
