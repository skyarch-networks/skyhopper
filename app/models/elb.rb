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
  end

  # return instance description.
  # @return [Array<Hash{Symbol => String}>]
  def instances
    data = @elb.describe_instance_health(load_balancer_name: @name)
    return data.instance_states.map(&:to_hash)
  end

  # @return [Array<Hash{Symbol => String}>]
  def listeners
    return details.listener_descriptions.map(&:listener).map(&:to_hash).map do |l|
      crt_id = l[:ssl_certificate_id]
      if crt_id == "Invalid-Certificate"
        l[:expiration] = ""
      elsif crt_id
        l[:expiration] = ssl_expiration(crt_id)
      else
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
  # protocol is HTTP or TCP or HTTPS or SSL.
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
  def delete_listener(load_balancer_port)
    @elb.delete_load_balancer_listeners(
      load_balancer_name: @name,
      load_balancer_ports: [ load_balancer_port ],
    )
  end
  
  # Upload server certificate
  def upload_server_certificate(server_certificate_name, certificate_body, private_key, certificate_chain)
    iam = Aws::IAM::Client.new(@aws_params)
    if (certificate_chain.nil?) || (certificate_chain.empty?) then
      iam.upload_server_certificate(
        server_certificate_name: server_certificate_name,
        certificate_body: certificate_body,
        private_key: private_key,
      )
    else
      iam.upload_server_certificate(
        server_certificate_name: server_certificate_name,
        certificate_body: certificate_body,
        private_key: private_key,
        certificate_chain: certificate_chain,
      )
    end
  end
  
  # Delete server certificate
  def delete_server_certificate(server_certificate_name)
    iam = Aws::IAM::Client.new(@aws_params)
    iam.delete_server_certificate({
      server_certificate_name: server_certificate_name,
    })
  end
  
  # Get list of server certificate
  def list_server_certificates()
    iam = Aws::IAM::Client.new(@aws_params)
    return iam.list_server_certificates({})
  end
  
  # Describe ELB
  def describe()
    return @elb.describe_load_balancers({
      load_balancer_names: [@name],
    }).load_balancer_descriptions[0]
  end
  
  # Describe ELB listener
  def describe_listener(load_balancer_port)
    describe().listener_descriptions.each do |listener|
      if listener[0].load_balancer_port == load_balancer_port then
        return listener[0]
      end
    end
    return nil
  end
  

  private


  # @return [Struct]
  def details
    return @details ||= (
      data = @elb.describe_load_balancers(load_balancer_names: [@name])
      data.load_balancer_descriptions.first
    )
  end

  # @param [String] crt_id example: arn:aws:iam::000000000000:server-certificate/certName
  # @return [Time] expiration date.
  def ssl_expiration(crt_id)
    id_body = crt_id[/\/(.+)$/, 1]
    iam = Aws::IAM::Client.new(@aws_params)
    res = iam.get_server_certificate(server_certificate_name: id_body)
    return res.server_certificate.server_certificate_metadata.expiration
  end
end
