#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Resource::RDS::DBInstance < TemplateBuilder::Resource
  # http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html
  InstanceClasses = %w[
    db.t1.micro
    db.m1.small
    db.m3.medium
    db.m3.large
    db.m3.xlarge
    db.m3.2xlarge
    db.r3.large
    db.r3.xlarge
    db.r3.2xlarge
    db.r3.4xlarge
    db.r3.8xlarge
    db.m2.xlarge
    db.m2.2xlarge
    db.m2.4xlarge
    db.cr1.8xlarge
    db.m1.medium
    db.m1.large
    db.m1.xlarge
  ].recursive_freeze

  @@properties = [
    # XXX: Conditionalなものはrequiredに倒してます。
    TemplateBuilder::Property.new(:Engine, String, required: true, select: true) { engines },
    TemplateBuilder::Property.new(:DBName, String), # TODO: data_validator
    TemplateBuilder::Property.new(:MultiAZ, :Boolean),
    TemplateBuilder::Property.new(:MasterUsername, String, required: true, data_validator: { min: 2, max: 16, regexp: /^[a-zA-Z0-9]+$/ }),
    TemplateBuilder::Property.new(:MasterUserPassword, String, required: true, data_validator: { min: 8 }),
    TemplateBuilder::Property.new(:DBInstanceClass, String, required: true, select: true) { instance_classes },
    TemplateBuilder::Property.new(:AllocatedStorage, String, required: true, data_validator: { regexp: /^[0-9]+$/ }),
    TemplateBuilder::Property.new(:DBInstanceIdentifier, String),
    TemplateBuilder::Property.new(:AllowMajorVersionUpgrade, :Boolean),
    TemplateBuilder::Property.new(:AutoMinorVersionUpgrade, :Boolean),
  ].freeze

  class << self
    # XXX: oracleとか
    def engines
      %w[mysql postgres]
    end

    def instance_classes
      InstanceClasses
    end
  end
end
