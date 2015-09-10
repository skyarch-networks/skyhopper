#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ElbController < ApplicationController
  include Concerns::InfraLogger

  # --------------- Auth
  before_action :authenticate_user!

  # POST /elb/create_listener
  def create_listener
    elb_name    = params.require(:elb_name)
    infra_id    = params.require(:infra_id)
    protocol            = params.require(:elb_listener_protocol)
    load_balancer_port  = params.require(:elb_listener_load_balancer_port)
    instance_protocol   = params.require(:elb_listener_instance_protocol)
    instance_port       = params.require(:elb_listener_instance_port)
    ssl_certificate_id  = params[:elb_listener_ssl_certificate_id]
    
    infra = Infrastructure.find(infra_id)
    elb   = ELB.new(infra, elb_name)

    elb.create_listener(protocol, load_balancer_port, instance_protocol, instance_port, ssl_certificate_id)

    render text: I18n.t('ec2_instances.msg.created_listener_to_elb')
  end
  
  # POST /elb/delete_listener
  def delete_listener
    elb_name    = params.require(:elb_name)
    infra_id    = params.require(:infra_id)
    load_balancer_port  = params.require(:elb_listener_load_balancer_port)

    infra = Infrastructure.find(infra_id)
    elb   = ELB.new(infra, elb_name)
    
    elb.delete_listener(load_balancer_port)

    render text: I18n.t('ec2_instances.msg.deleted_listener_to_elb')
  end
  
  # POST /elb/delete_and_create_listener
  def delete_and_create_listener
    elb_name    = params.require(:elb_name)
    infra_id    = params.require(:infra_id)
    protocol            = params.require(:elb_listener_protocol)
    old_load_balancer_port  = params.require(:elb_listener_old_load_balancer_port)
    load_balancer_port  = params.require(:elb_listener_load_balancer_port)
    instance_protocol   = params.require(:elb_listener_instance_protocol)
    instance_port       = params.require(:elb_listener_instance_port)
    ssl_certificate_id  = params[:elb_listener_ssl_certificate_id]

    infra = Infrastructure.find(infra_id)
    elb   = ELB.new(infra, elb_name)
    
    begin
      old_listener = elb.describe_listener(old_load_balancer_port.to_i)
      elb.delete_listener(old_load_balancer_port)
      elb.create_listener(protocol, load_balancer_port, instance_protocol, instance_port, ssl_certificate_id)
    rescue => error
      # Rollback start
      begin
        elb.create_listener(
          old_listener['protocol'],
          old_listener['load_balancer_port'],
          old_listener['instance_protocol'],
          old_listener['instance_port'],
          old_listener['ssl_certificate_id']
        )
      rescue => rollback_error
        raise 'Failed to rollback. Data might have been lost.'
      end
      # Rollback end
      raise error
      return
    end
    
    render text: I18n.t('ec2_instances.msg.deleted_listener_to_elb') + "<br />" + I18n.t('ec2_instances.msg.created_listener_to_elb')
  end
  
  # POST /elb/upload_server_certificate
  def upload_server_certificate
    elb_name    = params.require(:elb_name)
    infra_id    = params.require(:infra_id)
    server_certificate_name  = params.require(:ss_server_certificate_name)
    certificate_body  = params.require(:ss_certificate_body)
    private_key  = params.require(:ss_private_key)
    certificate_chain  = params[:ss_certificate_chain]
    
    infra = Infrastructure.find(infra_id)
    elb   = ELB.new(infra, elb_name)
    
    elb.upload_server_certificate(server_certificate_name, certificate_body, private_key, certificate_chain)
    
    render text: I18n.t('ec2_instances.msg.uploaded_certificate')
  end
  
  # POST /elb/delete_server_certificate
  def delete_server_certificate
    elb_name    = params.require(:elb_name)
    infra_id    = params.require(:infra_id)
    server_certificate_name  = params.require(:ss_server_certificate_name)

    infra = Infrastructure.find(infra_id)
    elb   = ELB.new(infra, elb_name)
    
    elb.delete_server_certificate(server_certificate_name)

    render text: I18n.t('ec2_instances.msg.deleted_certificate')
  end

end
