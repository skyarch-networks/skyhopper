#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class OperationWorker
  include Sidekiq::Worker
  include Sidetiq::Schedulable

  recurrence backfill: true do
    minutely(3)
  end

  def perform

    now = Time.new.in_time_zone
    operation = OperationDuration.all
    operation.each do |item|
      # Check if resource is still available.
      if Resource.exists?(item.resource_id)
        resource = Resource.find(item.resource_id)
        if now >= item.start_date && now <= item.end_date
          start_time = item.recurring_date.start_time.strftime( "%H%M%S%N" ).to_i
          end_time = item.recurring_date.end_time.strftime( "%H%M%S%N" ).to_i
          case item.recurring_date.repeats
            when "everyday"
              evaluate_evr(start_time, end_time, now, resource, item.user_id)
            when "weekdays"
              evaluate_weekdays(start_time, end_time, now, resource, item.user_id)
            when "weekends"
              evaluate_weekends(start_time, end_time, now, resource, item.user_id)
            when "other"
              evaluate_other(start_time, end_time, now, resource, item.recurring_date.dates, item.user_id)
          end
        else
          stop(resource)
        end
      else
        OperationDuration.where(resource_id: item.resource_id).destroy_all
      end

    end
  end

  def evaluate_evr(start_time, end_time, now, resource, user_id)
    now_time = now.strftime( "%H%M%S%N" ).to_i
    if start_time <= now_time && end_time >= now_time
      start(resource, user_id)
    else
      stop(resource, user_id)
    end
  end

  def evaluate_weekdays(start_time, end_time, now, resource, user_id)
    now_time = now.strftime( "%H%M%S%N" ).to_i
    if now.wday.nonzero? && now.wday != 6
      if start_time <= now_time && end_time >= now_time
        start(resource, user_id)
      else
        stop(resource, user_id)
      end
    else
      stop(resource, user_id)
    end
  end

  def evaluate_weekends(start_time, end_time, now, resource, user_id)
    now_time = now.strftime( "%H%M%S%N" ).to_i
    if now.wday.nonzero? || now.wday == 6
      if start_time <= now_time && end_time >= now_time
        start(resource, user_id)
      else
        stop(resource, user_id)
      end
    else
      stop(resource, user_id)
    end
  end

  def evaluate_other(start_time, end_time, now, resource, dates, user_id)
    now_time = now.strftime( "%H%M%S%N" ).to_i
    dow =  Array.new
    dates.each do |item|
      if item[1]["checked"] == "true"
        dow.push(item[1]["value"].to_i)
      end
    end

    if dow.include? now.wday
      if start_time <= now_time && end_time >= now_time
        start(resource, user_id)
      else
        stop(resource, user_id)
      end
    else
      stop(resource, user_id)
    end

  end

  def start(resource, user_id)
    ws = WSConnector.new('notifications', User.find(user_id).ws_key)

    instance = resource.infrastructure.instance(resource.physical_id)
    if instance.status == :stopped
      instance.start
      log_msg = "Started: #{instance.physical_id}. As Scheduled."
      log = InfrastructureLog.create(infrastructure_id: resource.infrastructure_id, user_id: user_id, details: log_msg, status: true)
      ws.push_as_json({message: log.details, status: true, timestamp: Time.zone.now.to_s})
    end

  end

  def stop(resource, user_id)
    ws = WSConnector.new('notifications', User.find(user_id).ws_key)
    instance = resource.infrastructure.instance(resource.physical_id)
    if instance.status == :running
      instance.stop
      log_msg = "Stopped: #{instance.physical_id}. As Scheduled."

      log = InfrastructureLog.create(infrastructure_id: resource.infrastructure_id, user_id: user_id, details: log_msg, status: true)
      ws.push_as_json({message: log.details, status: log.status, timestamp: Time.zone.now.to_s})
    end
  end


end
