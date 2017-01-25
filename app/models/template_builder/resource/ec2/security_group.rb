#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Resource::EC2::SecurityGroup < TemplateBuilder::Resource

  sec_group_prop_type = TemplateBuilder::Property.new(:SecurityGroup, Hash, data_validator: {
    IpProtocol: TemplateBuilder::Property.new(:IpProtocol, String, required: true),
    FromPort: TemplateBuilder::Property.new(:FromPort, String, required: true),
    ToPort: TemplateBuilder::Property.new(:ToPort, String, required: true),
    CidrIp: TemplateBuilder::Property.new(:CidrIp, String, required: true, data_validator: {regexp: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}/}),
  })

  @@properties = [
    TemplateBuilder::Property.new(:GroupDescription, String, required: true),
    TemplateBuilder::Property.new(:SecurityGroupIngress, Array, data_validator: sec_group_prop_type),
    TemplateBuilder::Property.new(:SecurityGroupEgress, Array, data_validator: sec_group_prop_type),
    TemplateBuilder::Property.new(:VpcId, String, refs: 'AWS::EC2::VPC'),
  ]
end
