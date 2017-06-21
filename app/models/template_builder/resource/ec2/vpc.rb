#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Resource::EC2::VPC < TemplateBuilder::Resource
  @@properties = [
    TemplateBuilder::Property.new(:CidrBlock, String, required: true),
    TemplateBuilder::Property.new(:EnableDnsSupport, :Boolean),
    TemplateBuilder::Property.new(:EnableDnsHostnames, :Boolean),
    TemplateBuilder::Property.new(:InstanceTenancy, String, select: true){instance_tenancies}
    # TODO: Tags
  ].freeze

  class << self
    def instance_tenancies
      ['default', 'dedicated']
    end
  end
end
