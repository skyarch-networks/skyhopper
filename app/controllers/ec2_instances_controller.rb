#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# for Ec2 instance

class Ec2InstancesController < ApplicationController
  include Concerns::BeforeAuth
  include Concerns::InfraLogger


  # --------------- Auth
  before_action :authenticate_user!

  before_action do
    infra_id = params.require(:infra_id)
    allowed_infrastructure(infra_id)
  end


  # TODO: use websocket
  # POST /ec2_instances/i-0b8e7f12/change_scale
  def change_scale
    physical_id = params.require(:id)
    infra_id    = params.require(:infra_id)
    type        = params.require(:instance_type)
    infra       = Infrastructure.find(infra_id)

    instance = infra.instance(physical_id)
    before_type = instance.instance_type

    begin
      changed_type = instance.change_scale(type)
    rescue EC2Instance::ChangeScaleError => ex
      render text: ex.message, status: 400 and return
    end

    if changed_type == before_type
      #TODO: status code はこれでいい?
      render text: I18n.t('nodes.msg.not_change_scale', type: type), status: 200 and return
    end

    render text: I18n.t('nodes.msg.changed_scale', type: type) and return
  end

  # TODO: return ec2 status
  # XXX: DRY (Ref: ServerStateConroller)

  # POST /ec2_instances/i-hogehoge/start
  def start
    physical_id = params.require(:id)
    infra_id    = params.require(:infra_id)

    instance = Infrastructure.find(infra_id).instance(physical_id)
    instance.start
    infra_logger_success("#{physical_id} turned on the power.")

    notify_ec2_status(instance, :running)

    render nothing: true
  end

  # POST /ec2_instances/i-hogehoge/stop
  def stop
    physical_id = params.require(:id)
    infra_id    = params.require(:infra_id)

    instance = Infrastructure.find(infra_id).instance(physical_id)
    instance.stop
    infra_logger_success("#{physical_id} turned off the power.")

    notify_ec2_status(instance, :stopped)

    render nothing: true
  end

  # POST /ec2_instances/i-hogehoge/reboot
  # XXX: reboot しても status が変わらない気がする?
  def reboot
    physical_id = params.require(:id)
    infra_id    = params.require(:infra_id)

    Infrastructure.find(infra_id).instance(physical_id).reboot
    infra_logger_success("#{physical_id} start reboot.")

    render nothing: true
  end


  # GET /ec2_instances/:id/serverspec_status
  # @param [String] id ec2 instance physical_id
  # @param [String] infra_id Infrastructure id
  # @return [String] JSON. {status: Boolean}
  def serverspec_status
    physical_id = params.require(:id)
    status = Rails.cache.read(ServerspecStatus::TagName + physical_id) != ServerspecStatus::Failed

    render json: {status: status}
  end


  private

  def notify_ec2_status(instance, status)
    Thread.new_with_db do
      ws = WSConnector.new('ec2_status', instance.physical_id)
      begin
        instance.wait_status(status)
        ws.push_as_json(error: nil, msg: "#{instance.physical_id} status is #{status}")
      rescue => ex
        ws.push_as_json(error: ex.message)
      end
    end
  end
end
