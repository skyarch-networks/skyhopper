#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class OperationWorker
  include Sidekiq::Worker


  def perform

    now = Time.new.in_time_zone
    operation = OperationDuration.all
    operation.each do |item|
      # Check if resource is still available.
      if Resource.exists?(item.resource_id)
        resource = Resource.find(item.resource_id)
        start_time = item.recurring_date.start_time.strftime( "%H%M%S%N" ).to_i
        end_time = item.recurring_date.end_time.strftime( "%H%M%S%N" ).to_i
        params = { start_time: start_time,
                   end_time: end_time,
                   resource: resource,
                   now: now,
                   user: item.user_id,
                   recurring_date: item.recurring_date.dates,
                   repeats: item.recurring_date.repeats}
        if now >= item.start_date && now <= item.end_date
          case item.recurring_date.repeats
            when "everyday"
              evaluate_evr(params)
            when "weekdays"
              evaluate_weekdays(params)
            when "weekends"
              evaluate_weekends(params)
            when "other"
              evaluate_other(params)
          end
        else
          stop(params)
        end
      else
        OperationDuration.where(resource_id: item.resource_id).destroy_all
      end

    end
  end

  def evaluate_evr(params)
    now_time = params[:now].strftime( "%H%M%S%N" ).to_i
    if params[:start_time] <= now_time && params[:end_time] >= now_time
      start(params)
    else
      stop(params)
    end
  end

  def evaluate_weekdays(params)
    if params[:now].wday.nonzero? && params[:now].wday != 6
      evaluate_evr(params)
    else
      stop(params)
    end
  end

  def evaluate_weekends(params)
    if params[:now].wday.zero? || params[:now].wday == 6
      evaluate_evr(params)
    else
      stop(params)
    end
  end

  def evaluate_other(params)
    dow =  Array.new
    dates.each do |item|
      if item[1]["checked"] == "true"
        dow.push(item[1]["value"].to_i)
      end
    end

    if dow.include? params[:now].wday
      evaluate_evr(params)
    else
      stop(params)
    end
  end

  def start(params)
    ws = WSConnector.new('notifications', User.find(params[:user]).ws_key)

    instance = params[:resource].infrastructure.instance(params[:resource].physical_id)
    if instance.status == :stopped
      instance.start
      log_msg = "Started: #{instance.physical_id}. As Scheduled. on #{params[:repeats]}"
      log = InfrastructureLog.create(infrastructure_id: params[:resource].infrastructure_id, user_id: params[:user], details: log_msg, status: true)
      ws.push_as_json({message: log.details, status: true, timestamp: Time.zone.now.to_s})
    end

  end

  def stop(params)
    ws = WSConnector.new('notifications', User.find(params[:user]).ws_key)
    instance = params[:resource].infrastructure.instance(params[:resource].physical_id)
    if instance.status == :running
      instance.stop
      log_msg = "Stopped: #{instance.physical_id}. As Scheduled on #{params[:repeats]}"

      log = InfrastructureLog.create(infrastructure_id: params[:resource].infrastructure_id, user_id: params[:user], details: log_msg, status: true)
      ws.push_as_json({message: log.details, status: log.status, timestamp: Time.zone.now.to_s})
    end
  end




end
