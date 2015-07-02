#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class EC2Instance
  # instance_types を取得するAPIがなさそう?
  Types = AWS::InstanceTypes[:current] + AWS::InstanceTypes[:previous]
end
