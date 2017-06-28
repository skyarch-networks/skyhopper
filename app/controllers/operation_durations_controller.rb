# -*- coding: utf-8 -*-
#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class OperationDurationsController < ApplicationController
  include Concerns::InfraLogger

  # --------------- Auth
  before_action :authenticate_user!

  before_action :set_infra

  before_action do
    def @infra.policy_class;OperationDurationPolicy;end
    authorize(@infra)
  end

  class UploadCalendarError < ::StandardError; end

  # GET /OperationDurations/show
  # @param [Integer] infra_id
  # @param [String]  physical_id
  def show
    physical_id = params.require(:physical_id)
    @resource = Resource.find_by(physical_id: physical_id)

    @operation_schedule = @resource.operation_durations

    if @operation_schedule.blank?
      render text: I18n.t('operation_scheduler.msg.empty'), status: 404 and return
    end

    respond_to do |format|
      format.json { render json: @operation_schedule.as_json(only: [:id, :start_date, :end_date],
                                                             include: [{recurring_date: {only: [:id, :repeats, :start_time, :end_time, :dates]}},
                                                                       {resource: {only: [:physical_id]}} ])
      }
    end
  end

  # POST /OperationDurations/create
  # @param [Integer] infra_id
  # @param [String] physical_id
  # @param [Object] instance
  def create
    instance =  params.require(:instance)
    ops_exists = OperationDuration.find_by(resource_id: instance[:resource_id])

    start_date = Time.at(instance[:start_date].to_i).in_time_zone
    end_date = Time.at(instance[:end_date].to_i).in_time_zone
    if ops_exists
      update_schedule(ops_exists, start_date, end_date, instance)
    else
      create_schedule(start_date, end_date, instance)
    end

    render text: I18n.t('operation_scheduler.msg.saved'), status: 200 and return
  end

  # GET /OperationDurations/:id
  # @param [Integer] resource_id
  # @param [String]  physical_id
  def show_icalendar
    physical_id = params.require(:physical_id)
    resource = Resource.find_by(physical_id: physical_id)
    schedule = OperationDuration.find_by(resource_id: resource.id)

    if schedule.blank?
      render text: I18n.t('operation_scheduler.msg.empty'), status: 500 and return
    end

    calendar = Icalendar::Calendar.new
    calendar.add_event(schedule.to_ics)
    calendar.publish

    headers['Content-Type'] = "text/calendar; charset=UTF-8"
    render text: calendar.to_ical, status: 200 and return
  end

  # POST /OperationDurations/upload_calendar
  # @param [Integer] infra_id
  # @param [String] physical_id
  # @param [String] value
  def upload_icalendar
    instance    =  params.require(:instance)
    ops_exists  = OperationDuration.find_by(resource_id: instance[:resource_id])
    value       = params.require(:value)
    events        = Icalendar::Calendar.parse(value).first.events.first

    unless defined? events.dtstart
      raise UploadCalendarError, I18n.t('operation_scheduler.msg.no_dtstart')
    end
    unless defined? events.dtend
      raise UploadCalendarError, I18n.t('operation_scheduler.msg.no_dtend')
    end

    start_date  = events.dtstart
    end_date    = events.dtend
    rrules      = events.rrule.first

    instance = parse_rules(rrules, instance)


    if ops_exists
      update_schedule(ops_exists, start_date, end_date, instance)
    else
      create_schedule(start_date, end_date, instance)
    end


    render text: I18n.t('operation_scheduler.msg.saved'), status: 200 and return
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def create_schedule(start_date, end_date, instance)
    ops = OperationDuration.create!(
      resource_id:  instance[:resource_id],
      start_date:   start_date,
      end_date:     end_date,
      user_id: current_user.id
    )
    RecurringDate.create!(
      operation_duration_id: ops.id,
      repeats: instance[:repeat_freq].to_i,
      start_time:  start_date.strftime("%H:%M"),
      end_time: end_date.strftime("%H:%M"),
      dates: instance[:dates]
    )
  end

  def update_schedule(ops_exists, start_date, end_date, instance)
    ops_exists.start_date = start_date
    ops_exists.end_date =  end_date
    ops_exists.save

    recur_exits = RecurringDate.find_by(operation_duration_id: ops_exists.id)
    recur_exits.repeats = instance[:repeat_freq].to_i
    recur_exits.start_time = start_date.strftime("%H:%M")
    recur_exits.end_time = end_date.strftime("%H:%M")
    recur_exits.dates = instance[:dates]
    recur_exits.save
  end

  def parse_rules(rrules, instance)
    date_names = ["SU","MO","TU","WE","TH","FR", "ST"]
    allowed_frequencies = ["DAILY", "WEEKLY"]

    if !defined? rrules.frequency
      raise UploadCalendarError, I18n.t('operation_scheduler.msg.no_frequency')
    elsif !allowed_frequencies.include?(rrules.frequency)
      raise UploadCalendarError, I18n.t('operation_scheduler.msg.invalid_frequency')
    end


    if rrules.frequency == "DAILY"
      instance[:repeat_freq] = 1
    else
      raise UploadCalendarError, I18n.t('operation_scheduler.msg.no_by_day') if !defined? rrules.by_day

      instance[:repeat_freq] = 4
      instance[:dates].map do |day|
        day.second["checked"] = rrules.by_day.include?(date_names[day.second["value"].to_i]).to_s
      end
    end

    return instance
  end

  def set_infra
    @infra = Infrastructure.find(params.require(:id))
  end

end


