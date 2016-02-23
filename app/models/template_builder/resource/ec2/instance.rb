#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Resource::EC2::Instance < TemplateBuilder::Resource

  #rubocop:disable Style/MutableConstant
  InstanceTypes = {}
  AWS::InstanceTypes[:current].each do |type|
    InstanceTypes[type.to_s] = {HVM: true}

    group = type.to_s[/^([0-9a-z]+)./, 1].upcase.to_sym
    if !AWS::InstanceTypes[:features][group][:hvm_only]
      InstanceTypes[type.to_s][:PV] = true
    end
  end
  AWS::InstanceTypes[:previous].each do |type|
    InstanceTypes[type.to_s] = {PV: true}
  end

  InstanceTypes.recursive_freeze

  @@properties = [
    # API的にはrequiredではないが、requiredとして扱いたい
    TemplateBuilder::Property.new(:InstanceType, String, required: true, select: true){instance_types},
    TemplateBuilder::Property.new(:DisableApiTermination, :Boolean),
    TemplateBuilder::Property.new(:Monitoring, :Boolean),
    TemplateBuilder::Property.new(:SecurityGroupIds, Array, data_validator: String),
    TemplateBuilder::Property.new(:Tags, Array, data_validator:
      TemplateBuilder::Property.new(:EC2_Tag, Hash, data_validator: {
        Key:   TemplateBuilder::Property.new(:Key,   String, required: true),
        Value: TemplateBuilder::Property.new(:Value, String, required: true),
      })
    ),
  ].freeze

  # @name => @@resource_base
  @@resource_base = duped_resource_base
  @@resource_base[:Properties][:KeyName] = {Ref: "KeyName"}
  @@resource_base.recursive_freeze


  class << self
    def instance_types
      InstanceTypes.keys
    end
  end

  # 仮想化方式を返す。
  # HVMとPVの両方を使用可能であれば、HVMを返す。
  # XXX: InstanceTypeをRefで参照する時は、HVMに倒される
  def virtual_type
    instance_type = @properties[:InstanceType]
    return nil unless instance_type
    return :HVM if instance_type.kind_of?(Hash) and instance_type.size == 1 and instance_type[:Ref]

    if InstanceTypes[instance_type][:HVM]
      return :HVM
    else
      return :PV
    end
  end

  def build
    result = super
    result[@name][:Properties][:ImageId] = {
      'Fn::FindInMap'.to_sym => ["RegionMap#{virtual_type}", {Ref: "AWS::Region"}, "AMI"],
    }

    return result
  end
end
