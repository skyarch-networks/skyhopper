#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Resource::RDS::DBInstance < TemplateBuilder::Resource
  # http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html
  INSTANCE_CLASSES = %w[
    db.t2.micro
    db.t2.small
    db.t2.medium
    db.t2.large
    db.t2.xlarge
    db.t2.2xlarge
    db.t3.micro
    db.t3.small
    db.t3.medium
    db.t3.large
    db.t3.xlarge
    db.t3.2xlarge
    db.m2.xlarge
    db.m2.2xlarge
    db.m2.4xlarge
    db.r3.large
    db.r3.xlarge
    db.r3.2xlarge
    db.r3.4xlarge
    db.r3.8xlarge
    db.r4.large
    db.r4.xlarge
    db.r4.2xlarge
    db.r4.4xlarge
    db.r4.8xlarge
    db.r4.16xlarge
    db.r5.large
    db.r5.xlarge
    db.r5.2xlarge
    db.r5.4xlarge
    db.r5.12xlarge
    db.r5.24xlarge
    db.x1.16xlarge
    db.x1.32xlarge
    db.x1e.xlarge
    db.x1e.2xlarge
    db.x1e.4xlarge
    db.x1e.8xlarge
    db.x1e.16xlarge
    db.x1e.32xlarge
    db.z1d.large
    db.z1d.xlarge
    db.z1d.2xlarge
    db.z1d.3xlarge
    db.z1d.6xlarge
    db.z1d.12xlarge
    db.m1.small
    db.m1.medium
    db.m1.large
    db.m1.xlarge
    db.m3.medium
    db.m3.large
    db.m3.xlarge
    db.m3.2xlarge
    db.m4.large
    db.m4.xlarge
    db.m4.2xlarge
    db.m4.4xlarge
    db.m4.10xlarge
    db.m4.16xlarge
    db.m5.large
    db.m5.xlarge
    db.m5.2xlarge
    db.m5.4xlarge
    db.m5.12xlarge
    db.m5.24xlarge
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
      INSTANCE_CLASSES
    end
  end
end
