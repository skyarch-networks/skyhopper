#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
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
    db.cr1.8xl
  ].recursive_freeze

  def initialize(infra, physical_id)
    access_key_id     = infra.access_key
    secret_access_key = infra.secret_access_key
    region            = infra.region

    @rds = ::AWS::RDS.new(
      access_key_id:     access_key_id,
      secret_access_key: secret_access_key,
      region:            region
    )

    @db_instance = @rds.db_instances[physical_id]
    __setobj__(@db_instance)
  end

  # ----------------------------------- method wrapper


  def engine_type
    @db_instance.engine
  end

  def engine
    "#{@db_instance.engine} (#{@db_instance.engine_version})"
  end

  def multi_az
    if @db_instance.multi_az?
      return "YES"
    else
      return "NO"
    end
  end

  def change_scale(scale)
    unless Types.include?(scale)
      raise ChangeScaleError, "Invalid type name: #{scale}"
    end

    if scale == db_instance_class
      return scale
    end

    begin
      modify(db_instance_class: scale,  apply_immediately: true)
    rescue AWS::RDS::Errors::InvalidParameterValue => ex
      raise ChangeScaleError, ex.message
    end

    scale
  end
end
