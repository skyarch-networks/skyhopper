#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Resource::EC2::EIP < TemplateBuilder::Resource

  @@properties = [
    TemplateBuilder::Property.new(:InstanceId, String, refs: "EC2::Instance"),
    TemplateBuilder::Property.new(:Domain, String)
  ].freeze

end