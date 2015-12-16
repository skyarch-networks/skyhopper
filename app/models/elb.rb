#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ELB
  def initialize(infra, elb_name)
    access_key_id = infra.access_key
    secret_access_key = infra.secret_access_key
    region = infra.region

    @name = elb_name

    @aws_params = {
      access_key_id:     access_key_id,
      secret_access_key: secret_access_key,
      region:            region,
    }

    @elb = ::Aws::ElasticLoadBalancing::Client.new(@aws_params)
    @iam = Aws::IAM::Client.new(@aws_params)
  end

  # return instance description.
  # @return [Array<Hash{Symbol => String}>]
  def instances
    data = @elb.describe_instance_health(load_balancer_name: @name)
    return data.instance_states.map(&:to_hash)
  end

  # return instance description.
  # @return [Array<Hash{Symbol => String}>]
  def security_groups
    return details.security_groups
  end

  # @return [Array<Hash{Symbol => String}>]
  def listeners
    return details.listener_descriptions.map(&:listener).map(&:to_hash).map do |l|
      if !l[:ssl_certificate_id]
        l[:ssl_certificate_id] = ""
      end
      l
    end
  end

  # @return [String]
  def dns_name
    return details.dns_name
  end

  # register EC2 instance to ELB
  # @param [String] physical_id ID of EC2 instance.
  def register(physical_id)
    @elb.register_instances_with_load_balancer(
      load_balancer_name: @name,
      instances: [{instance_id: physical_id}],
    )
  end

  # deregister EC2 instance from ELB
  # @param [String] physical_id ID of EC2 instance.
  def deregister(physical_id)
    @elb.deregister_instances_from_load_balancer(
      load_balancer_name: @name,
      instances:[{instance_id: physical_id}],
    )
  end

  # create ELB listener
  # @param [String] protocol Loadbalancer protocol".
  # @param [String] load_balancer_port Loadbalancer port.
  # @param [String] instance_protocol Instance protocol.
  # @param [String] instance_port Instance port.
  # @param [String] ssl_certificate_id Certificate id.
  def create_listener(protocol, load_balancer_port, instance_protocol, instance_port, ssl_certificate_id)
    @elb.create_load_balancer_listeners(
      load_balancer_name: @name,
      listeners: [{
        protocol: protocol,
        load_balancer_port: load_balancer_port,
        instance_protocol: instance_protocol,
        instance_port: instance_port,
        ssl_certificate_id: ssl_certificate_id,
      }],
    )
  end

  # Delete ELB listener
  # @param [String] load_balancer_port Loadbalancer port.
  def delete_listener(load_balancer_port)
    @elb.delete_load_balancer_listeners(
      load_balancer_name: @name,
      load_balancer_ports: [ load_balancer_port ],
    )
  end

  # Upload server certificate
  # @param [String] server_certificate_name Certificate name".
  # @param [String] certificate_body Public certificate.
  # @param [String] private_key Private key.
  # @param [String] certificate_chain Certificate chain.
  def upload_server_certificate(server_certificate_name, certificate_body, private_key, certificate_chain)
    if certificate_chain.blank?
      @iam.upload_server_certificate(
        server_certificate_name: server_certificate_name,
        certificate_body: certificate_body,
        private_key: private_key,
      )
    else
      @iam.upload_server_certificate(
        server_certificate_name: server_certificate_name,
        certificate_body: certificate_body,
        private_key: private_key,
        certificate_chain: certificate_chain,
      )
    end
  end

  # Delete server certificate
  # @param [String] server_certificate_name Certificate name".
  def delete_server_certificate(server_certificate_name)
    @iam.delete_server_certificate(
      server_certificate_name: server_certificate_name,
    )
  end

  # Get list of server certificate
  # @return [Struct]
  def list_server_certificates
    return @iam.list_server_certificates({})
  end

  # Describe ELB
  # @return [Struct]
  def describe
    return @elb.describe_load_balancers(
      load_balancer_names: [@name],
    ).load_balancer_descriptions[0]
  end

  # Describe ELB listener
  # @param [Integer] load_balancer_port
  # @return [Struct]
  def describe_listener(load_balancer_port)
    describe.listener_descriptions.each do |listener|
      if listener[0].load_balancer_port == load_balancer_port then
        return listener[0]
      end
    end
    return nil
  end


  # register EC2 instance to ELB
  # @param [Array] security group id.
  def elb_submit_groups(group_ids)
    @elb.apply_security_groups_to_load_balancer(
      load_balancer_name: @name,
      security_groups: group_ids,
    )
  end

  private


  # @return [Struct]
  def details
    return @details ||= (
      data = @elb.describe_load_balancers(load_balancer_names: [@name])
      data.load_balancer_descriptions.first
    )
  end

end
