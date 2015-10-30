#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Operation_worker

  def perform
    # ws = WSConnector.new('notifications', User.find(user_id).ws_key)
    now = Time.new.in_time_zone
    operation = OperationDuration.all
    operation.each do |item|
      # Check if resource is still available.
      if Resource.exists?(item.resource_id)
        resource = Resource.find(item.resource_id)
        if now >= item.start_date && now <= item.end_date
          start_time = item.recurring_date.end_time.strftime( "%H%M%S%N" ).to_i
          end_time = item.recurring_date.start_time.strftime( "%H%M%S%N" ).to_i
          case item.recurring_date
            when "everyday"
              evaluate_evr(start_time, end_time, now, resource)
            when "weekdays"
              evaluate_weekdays(start_time, end_time, now, resource)
            when "weekends"
              evaluate_weekends(start_time, end_time, now, resource)
            when "other"
              evaluate_other(start_time, end_time, now, resource, item.recurring_date.dates)
          end
        else
          stop(resource)
        end
      else
        OperationDuration.where(resource_id: item.resource_id).destroy_all
      end

    end
  end

  def evaluate_evr(start_time, end_time, now, resource)
    now_time = now.strftime( "%H%M%S%N" ).to_i
    if start_time <= now_time && end_time >= now_time
      start(resource)
    else
      stop(resource)
    end
  end

  def evaluate_weekdays(start_time, end_time, now, resource)
    now_time = now.strftime( "%H%M%S%N" ).to_i
    if now.wday != 0 && now.wday != 6
      if start_time <= now_time && end_time >= now_time
        start(resource)
      else
        stop(resource)
      end
    else
      stop(resource)
    end
  end

  def evaluate_weekends(start_time, end_time, now, resource)
    now_time = now.strftime( "%H%M%S%N" ).to_i
    if now.wday == 0 && now.wday == 6
      if start_time <= now_time && end_time >= now_time
        start(resource)
      else
        stop(resource)
      end
    else
      stop(resource)
    end
  end

  def evaluate_other(start_time, end_time, now, resource, dates)
    now_time = now.strftime( "%H%M%S%N" ).to_i
    dow =  Array.new
    dates.each do |item|
      if item[1]["checked"] == "true"
        dow.push(item[1]["value"].to_i)
      end
    end

    if dow.include? now.wday
      if start_time <= now_time && end_time >= now_time
        start(resource)
      else
        stop(resource)
      end
    else
      stop(instance)
    end

  end

  def start(resource)
    instance = resource.infrastructure.instance(resource.physical_id)
    if instance.status == :stopped
      instance.start
      notify_ec2_status(resource, "Started: #{instance.physical_id} ")
      Rails.logger.debug "Started: #{instance.physical_id} "
    end

  end

  def stop(resource)
    instance = resource.infrastructure.instance(resource.physical_id)
    if instance.status == :running
      instance.stop
      notify_ec2_status(resource, "Started: #{instance.physical_id} ")
      Rails.logger.debug "Stopped: #{instance.physical_id}"
    end
  end

  def notify_ec2_status(resource, details)
    Thread.new_with_db do
      ws = WSConnector.new('ec2_status', resource.physical_id)
      begin
        InfrastructureLog.create(infrastructure_id: resource.infrastructure_id, details: details)
        ws.push_as_json(error: nil, msg: "#{resource.physical_id} status is #{details}")
      rescue => ex
        ws.push_error(ex)
      end
    end
  end

end
