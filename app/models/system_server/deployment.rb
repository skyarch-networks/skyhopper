#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'pathname'
require 'json'

class SystemServer::Deployment
  EC2User = 'ec2-user'.freeze

  # TODO: Refactor
  Progress = {
    creating_zabbix_server: { percentage: 50, status: :in_progress },
    complete: { percentage: 100, status: :complete },
    error: { percentage: nil, status: :error },
  }.freeze

  class SystemServerError < ::StandardError; end

  class << self
    def create_zabbix(stack_name, region, keypair_name, keypair_value, params = {})
      prj = Project.for_zabbix_server
      unless prj
        raise SystemServerError, I18n.t('app_settings.msg.db_seed_not_found', server: 'Zabbix')
      end

      infra = Infrastructure.create_with_ec2_private_key(
        project: prj,
        stack_name: stack_name,
        keypair_name: keypair_name,
        keypair_value: keypair_value,
        region: region,
      )
      template = ERB::Builder.new('zabbix_server').build
      stack = create_stack(infra, 'Zabbix Server', template, params: params)
      wait_creation(stack)

      physical_id = stack.instances.first.physical_resource_id
      server = new(infra, physical_id)
      server.wait_init_ec2

      zb = ZabbixServer.create(
        fqdn: server.fqdn,
        username: 'admin',
        password: 'ilikerandompasswords',
        version: '2.2.9',
        details: 'Default Zabbix Server for Skyhopper System',
      )

      # Save newly created zabbix server id to zabbix infra.
      prj.zabbix_server_id = zb.id
      prj.save!
    rescue StandardError => ex
      Rails.logger.error(ex)
      raise ex
    end

    private

    def create_stack(infra, name, template, params: {})
      made_params = params.deep_dup.merge({ InstanceName: name })

      cf_template = CfTemplate.new(
        infrastructure_id: infra.id,
        name: name,
        detail: "#{name} auto generated",
        value: template,
        format: 'JSON',
      )
      cf_template.create_cfparams_set(infra, made_params)
      cf_template.update_cfparams
      cf_template.save!

      s = Stack.new(infra)
      s.create(template, cf_template.parsed_cfparams)

      s
    end

    def wait_creation(stack)
      stack.wait_status('CREATE_COMPLETE')
    end

    def __yield(data, msg = nil, &block)
      yield(data, msg) if block
    end
  end

  def initialize(infra, physical_id)
    @infra = infra
    @physical_id = physical_id
  end

  def fqdn
    @fqdn ||= @infra.instance(@physical_id).public_dns_name
  end

  def wait_init_ec2
    loop do
      begin
        exec_ssh(timeout: 5) {}
      rescue StandardError
        sleep 10
        next
      else
        break
      end
    end
  end

  private

  def exec_ssh(opt = {}, &block)
    Net::SSH.start(fqdn, EC2User, { key_data: [@infra.ec2_private_key.value] }.merge(opt), &block)
  end
end
