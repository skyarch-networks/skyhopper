#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class RDS < SimpleDelegator
  class ChangeScaleError < StandardError; end

  Types = %w[
    db.t1.micro
    db.m3.medium db.m3.large db.m3.xlarge db.m3.2xlarge
    db.m1.small db.m1.medium db.m1.large db.m1.xlarge
    db.m2.xlarge db.m2.2xlarge db.m2.4.xlarge
    db.m4.large db.m4.xlarge db.m4.2xlarge db.m4.4xlarge db.m4.10xlarge
    db.r3.large db.r3.xlarge db.r3.2xlarge db.r3.4xlarge db.r3.8xlarge
    db.t2.micro db.t2.small db.t2.medium db.t2.large
    db.cr1.8xl
  ].recursive_freeze

  def initialize(infra, physical_id)
    access_key_id     = infra.access_key
    secret_access_key = infra.secret_access_key
    region            = infra.region

    @rds = Aws::RDS::Client.new(
      access_key_id:     access_key_id,
      secret_access_key: secret_access_key,
      region:            region
    )

    @db_instance = @rds.describe_db_instances(db_instance_identifier: physical_id)[:db_instances][0] # get only 1 instance
    __setobj__(@db_instance)
  end

  # ----------------------------------- method wrapper

  def security_groups
    security_groups = []
    @db_instance[:vpc_security_groups].each do |item|
      if item.status == "active"
        security_groups.push(item.vpc_security_group_id)
      end
    end
    return security_groups
  end

  def change_scale(scale)
    unless Types.include?(scale)
      raise ChangeScaleError, "Invalid type name: #{scale}"
    end

    if scale == @db_instance[:db_instance_class]
      return scale
    end

    begin
      @rds.modify_db_instance({
        db_instance_class: scale,
        db_instance_identifier: @db_instance.db_instance_identifier,
        apply_immediately: true,
      })
    rescue AWS::RDS::Errors::InvalidParameterValue => ex
      raise ChangeScaleError, ex.message
    end

    scale
  end

  def modify_security_groups(group_ids)
    begin
      @rds.modify_db_instance({
        vpc_security_group_ids: group_ids,
        db_instance_identifier: @db_instance.db_instance_identifier,
        apply_immediately: true,
      })
    rescue AWS::RDS::Errors::InvalidParameterValue => ex
      raise ChangeScaleError, ex.message
    end
  end

  def physical_id
    self.db_instance_identifier
  end

end
