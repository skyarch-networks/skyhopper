# cronotab.rb — Crono configuration file
#
# Here you can specify periodic jobs and schedule.
# You can use ActiveJob's jobs from `app/jobs/`
# You can use any class. The only requirement is that
# class should have a method `perform` without arguments.
#
# class TestJob
#   def perform
#     puts 'Test!'
#   end
# end
#
# Crono.perform(TestJob).every 2.days, at: '15:30'
#
require 'rake'
# Be sure to change AppName to your application name!
SkyHopper::Application.load_tasks

class Operation_worker

  def perform
    Rake::Task['crono:hello'].invoke
    now = Time.new.in_time_zone
    operation = OperationDuration.all
    operation.each do |item|
      resource = Resource.find(item.resource_id)
      instance = resource.infrastructure.instance(resource.physical_id)
      if now >= item.start_date && now <= item.end_date
        puts item.inspect
        recurring = RecurringDate.find_by(operation_duration_id: item.id)
        case recurring.repeats
               when "everyday"
                 evaluate_evr(recurring.start_time.to_time,
                   recurring.end_time.to_time,
                   now, instance
                 )
               when "weekdays"
                 evaluate_weekdays(recurring.start_time.to_time,
                   recurring.end_time.to_time, now, instance
                 )
               when "weekends"
                 evaluate_weekends(recurring.start_time.to_time,
                   recurring.end_time.to_time, now, instance
                 )
               when "other"
                 evaluate_other(recurring.start_time.to_time,
                                recurring.end_time.to_time,
                                now, instance, recurring.dates)
             end
      end
    end
  end

  def evaluate_evr(start_time, end_time, now, instance)
    start = start_time.utc.strftime( "%H%M%S%N" ).to_i
    end_ = end_time.utc.strftime( "%H%M%S%N" ).to_i
    from_now =  now.strftime( "%H%M%S%N" ).to_i
    if start <= from_now && end_ >= from_now
      start(instance)
    else
      stop(instance)
    end
  end

  def evaluate_weekdays(start_time, end_time, now, instance)
    start = start_time.utc.strftime( "%H%M%S%N" ).to_i
    end_ = end_time.utc.strftime( "%H%M%S%N" ).to_i
    from_now =  now.strftime( "%H%M%S%N" ).to_i
    if now.wday != 0 && now.wday != 1
      if start <= from_now && end_ >= from_now
        start(instance)
      else
        stop(instance)
      end
    else
      stop(instance)
    end
  end

  def evaluate_weekends(start_time, end_time, now, instance)
    start = start_time.utc.strftime( "%H%M%S%N" ).to_i
    end_ = end_time.utc.strftime( "%H%M%S%N" ).to_i
    from_now =  now.strftime( "%H%M%S%N" ).to_i

    if now.wday == 0 && now.wday == 1
      if start <= from_now && end_ >= from_now
        start(instance)
      else
        stop(instance)
      end
    else
      stop(instance)
    end
  end

  def evaluate_other(start_time, end_time, now, instance, dates)
    dow =  Array.new
    start = start_time.utc.strftime( "%H%M%S%N" ).to_i
    end_ = end_time.utc.strftime( "%H%M%S%N" ).to_i
    from_now =  now.strftime( "%H%M%S%N" ).to_i

    dates.each do |item|
      if item[1]["checked"] == "true"
        dow.push(item[1]["value"].to_i)
      end
    end

    if dow.include? now.wday
      if start <= from_now && end_ >= from_now
        start(instance)
      else
        stop(instance)
      end
    else
      stop(instance)
    end

  end

  def start(instance)
    if instance.status == :stopped
      instance.start
      notify_ec2_status(instance, :running)
      puts "Started: #{instance.physical_id} "
    end

  end

  def stop(instance)
    if instance.status == :running
      instance.stop
      notify_ec2_status(instance, :stopped)
      puts "Stopped: #{instance.physical_id}"
    end
  end

  def notify_ec2_status(instance, status)
    Thread.new_with_db do
      ws = WSConnector.new('ec2_status', instance.physical_id)
      begin
        instance.wait_status(status)
        ws.push_as_json(error: nil, msg: "#{instance.physical_id} status is #{status}")
      rescue => ex
        ws.push_error(ex)
      end
    end
  end

end

Crono.perform(Operation_worker).every 5.seconds
