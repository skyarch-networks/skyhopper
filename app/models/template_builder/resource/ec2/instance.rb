#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Resource::EC2::Instance < TemplateBuilder::Resource

  InstanceTypes = {
    't1.micro'    => {           PV: true},
    't2.micro'    => {HVM: true          },
    't2.small'    => {HVM: true          },
    't2.medium'   => {HVM: true          },
    'm3.medium'   => {HVM: true, PV: true},
    'm3.large'    => {HVM: true, PV: true},
    'm3.xlarge'   => {HVM: true, PV: true},
    'm3.2xlarge'  => {HVM: true, PV: true},
    'm1.small'    => {           PV: true},
    'm1.medium'   => {           PV: true},
    'm1.large'    => {           PV: true},
    'm1.xlarge'   => {           PV: true},
    'c3.large'    => {HVM: true, PV: true},
    'c3.xlarge'   => {HVM: true, PV: true},
    'c3.2xlarge'  => {HVM: true, PV: true},
    'c3.4xlarge'  => {HVM: true, PV: true},
    'c3.8xlarge'  => {HVM: true, PV: true},
    'c1.medium'   => {           PV: true},
    'c1.xlarge'   => {           PV: true},
    'g2.2xlarge'  => {HVM: true          },
    'r3.large'    => {HVM: true          },
    'r3.xlarge'   => {HVM: true          },
    'r3.2xlarge'  => {HVM: true          },
    'r3.4xlarge'  => {HVM: true          },
    'r3.8xlarge'  => {HVM: true          },
    'm2.xlarge'   => {           PV: true},
    'm2.2xlarge'  => {           PV: true},
    'm2.4xlarge'  => {           PV: true},
    'i2.xlarge'   => {HVM: true          },
    'i2.2xlarge'  => {HVM: true          },
    'i2.4xlarge'  => {HVM: true          },
    'i2.8xlarge'  => {HVM: true          },
    'hi1.4xlarge' => {           PV: true},
    'hs1.8xlarge' => {HVM: true, PV: true}
  }.recursive_freeze

  @@properties = [
    # API的にはrequiredではないが、requiredとして扱いたい
    TemplateBuilder::Property.new(:InstanceType, String, required: true, select: true){instance_types},
    TemplateBuilder::Property.new(:DisableApiTermination, :Boolean),
    TemplateBuilder::Property.new(:Monitoring, :Boolean),
    TemplateBuilder::Property.new(:SecurityGroupIds, Array, data_validator: String),
    TemplateBuilder::Property.new(:Tags, Array, data_validator:
      TemplateBuilder::Property.new(:EC2_Tag, Hash, data_validator: {
        Key:   TemplateBuilder::Property.new(:Key,   String, required: true),
        Value: TemplateBuilder::Property.new(:Value, String, required: true)
      })
    )
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
    result[@name][:Properties].merge!(
      ImageId: {
        'Fn::FindInMap'.to_sym => ["RegionMap#{virtual_type}", {Ref: "AWS::Region"}, "AMI"]
      }
    )

    return result
  end
end
