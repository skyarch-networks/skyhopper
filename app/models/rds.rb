#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class RDS < SimpleDelegator
  class ChangeScaleError < StandardError; end

  TYPES = %w[
    db.t2.micro db.t2.small db.t2.medium db.t2.large db.t2.xlarge db.t2.2xlarge
    db.t3.micro db.t3.small db.t3.medium db.t3.large db.t3.xlarge db.t3.2xlarge
    db.m2.xlarge db.m2.2xlarge db.m2.4xlarge
    db.r3.large db.r3.xlarge db.r3.2xlarge db.r3.4xlarge db.r3.8xlarge
    db.r4.large db.r4.xlarge db.r4.2xlarge db.r4.4xlarge db.r4.8xlarge db.r4.16xlarge
    db.r5.large db.r5.xlarge db.r5.2xlarge db.r5.4xlarge db.r5.12xlarge db.r5.24xlarge
    db.x1.16xlarge db.x1.32xlarge
    db.x1e.xlarge db.x1e.2xlarge db.x1e.4xlarge db.x1e.8xlarge db.x1e.16xlarge db.x1e.32xlarge
    db.z1d.large db.z1d.xlarge db.z1d.2xlarge db.z1d.3xlarge db.z1d.6xlarge db.z1d.12xlarge
    db.m1.small db.m1.medium db.m1.large db.m1.xlarge
    db.m3.medium db.m3.large db.m3.xlarge db.m3.2xlarge
    db.m4.large db.m4.xlarge db.m4.2xlarge db.m4.4xlarge db.m4.10xlarge db.m4.16xlarge
    db.m5.large db.m5.xlarge db.m5.2xlarge db.m5.4xlarge db.m5.12xlarge db.m5.24xlarge
  ].recursive_freeze

  def initialize(infra, physical_id)
    access_key_id     = infra.access_key
    secret_access_key = infra.secret_access_key
    region            = infra.region

    @rds = Aws::RDS::Client.new(
      access_key_id: access_key_id,
      secret_access_key: secret_access_key,
      region: region,
    )

    @db_instance = @rds.describe_db_instances(db_instance_identifier: physical_id)[:db_instances][0] # get only 1 instance
    __setobj__(@db_instance)
  end

  # ----------------------------------- method wrapper

  def security_groups
    security_groups = []
    @db_instance[:vpc_security_groups].each do |item|
      if item.status == 'active'
        security_groups.push(item.vpc_security_group_id)
      end
    end
    security_groups
  end

  def change_scale(scale)
    unless TYPES.include?(scale)
      raise ChangeScaleError, "Invalid type name: #{scale}"
    end

    begin
      res = @rds.modify_db_instance({
                                      db_instance_class: scale,
                                      db_instance_identifier: @db_instance.db_instance_identifier,
                                      apply_immediately: true,
                                    })
      if res.db_instance.pending_modified_values.to_a.none?
        raise ChangeScaleError, 'DB instance is not modified.'
      end
    rescue AWS::RDS::Errors::InvalidParameterValue => ex
      raise ChangeScaleError, ex.message
    end

    res
  end

  def modify_security_groups(group_ids)
    @rds.modify_db_instance({
                              vpc_security_group_ids: group_ids,
                              db_instance_identifier: @db_instance.db_instance_identifier,
                              apply_immediately: true,
                            })
  rescue AWS::RDS::Errors::InvalidParameterValue => ex
    raise ChangeScaleError, ex.message
  end

  def physical_id
    db_instance_identifier
  end

  def start_db_instance
    @rds.start_db_instance(db_instance_identifier: physical_id)
  end

  def stop_db_instance
    @rds.stop_db_instance(db_instance_identifier: physical_id)
  end

  def reboot_db_instance
    @rds.reboot_db_instance(db_instance_identifier: physical_id)
  end
end
