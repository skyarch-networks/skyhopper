#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'pathname'
require "json"
require 'open3'

class ChefServer::Deployment
  TemplatePath = Rails.root.join("lib/cf_templates/chef_server.json").freeze
  EC2User      = "ec2-user".freeze

  # TODO: receive from controller
  User     = 'skyhopper'.freeze
  Org      = 'skyarch'.freeze

  # TODO: Refactor
  Progress = {
    creating_infra: {percentage:  10, status: :in_progress},
    init_ec2:       {percentage:  20, status: :in_progress},
    download_chef:  {percentage:  40, status: :in_progress},
    install_chef:   {percentage:  60, status: :in_progress},
    setting_chef:   {percentage:  80, status: :in_progress},
    complete:       {percentage: 100, status: :complete},
    error:          {percentage: nil, status: :error},
  }.freeze

  UserPemID         = 'User'.freeze
  OrgPemID          = 'Org'.freeze
  TrustedCertsPemID = "TrustedCerts".freeze

  class Error < StandardError; end


  class << self
    # chef_serverを作成し、自身のインスタンスを返す。
    # blockが与えられていれば、そのブロックに進捗状況を渡して実行する。
    def create(stack_name, region, keypair_name, keypair_value, &block)
      __yield :creating_infra, &block

      prj = Project.for_chef_server
      unless prj
        raise Error, "Project for Chef Server not found. Did you run db:seed? If didn't run, execute `bundle exec rake db:seed`"
      end

      infra = Infrastructure.create_with_ec2_private_key(
        project_id:    prj.id,
        stack_name:    stack_name,
        keypair_name:  keypair_name,
        keypair_value: keypair_value,
        region:        region
      )

      stack = create_stack(infra, 'Chef Server', params: {
        InstanceType:      't2.small',
        UserPemID:         UserPemID,
        OrgPemID:          OrgPemID,
        TrustedCertsPemID: TrustedCertsPemID,
      })

      __yield :init_ec2, &block
      stack.wait_resource_status('EC2Instance',       'CREATE_COMPLETE')
      __yield :download_chef, &block
      stack.wait_resource_status('wcDownloadChefPkg', 'CREATE_COMPLETE')
      __yield :install_chef,  &block
      stack.wait_resource_status('wcInstallChef',     'CREATE_COMPLETE')
      __yield :setting_chef, &block
      wait_creation(stack)

      physical_id = stack.instances.first.physical_resource_id
      chef_server = self.new(infra, physical_id)



      chef_server.init_knife_rb


      return chef_server
    rescue => ex
      Rails.logger.error(ex.message)
      __yield :error, ex.message, &block
      raise ex
    end


    # XXX: こぴぺをやめてここじゃないとこにちゃんと定義する
    def create_zabbix(stack_name, region, keypair_name, keypair_value)
      prj = Project.for_zabbix_server
      infra = Infrastructure.create_with_ec2_private_key(
        project:       prj,
        stack_name:    stack_name,
        keypair_name:  keypair_name,
        keypair_value: keypair_value,
        region:        region
      )
      template = ERB::Builder.new('zabbix_server').build
      stack = create_stack(infra, 'Zabbix Server', template: template)
      wait_creation(stack)

      physical_id = stack.instances.first.physical_resource_id
      server = self.new(infra, physical_id)
      server.wait_init_ec2
      set = AppSetting.first
      set.zabbix_fqdn = infra.instance(physical_id).public_dns_name
      set.zabbix_user = 'admin'
      set.zabbix_pass = 'ilikerandompasswords'
      set.save!

      ZabbixServer.create(
        fqdn: set.zabbix_fqdn,
        username: 'admin',
        password: 'ilikerandompasswords',
        version: '2.2.9',
        details: 'Default Zabbix Server for Skyhopper System'
      )

      AppSetting.clear_cache
    rescue => ex
      Rails.logger.error(ex)
    end

    private

    def create_stack(infra, name, params: {}, template: ERB::Builder.new('chef_server').build)
      params[:InstanceName] = name

      cf_template = CfTemplate.new(
        infrastructure_id: infra.id,
        name:              name,
        detail:            "#{name} auto generated",
        value:             template
      )
      cf_template.create_cfparams_set(infra, params)
      cf_template.update_cfparams
      cf_template.save!

      s = Stack.new(infra)
      s.create(template, cf_template.parsed_cfparams)

      return s
    end

    def wait_creation(stack)
      stack.wait_status("CREATE_COMPLETE")
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

  def url
    "https://#{fqdn}/organizations/#{Org}"
  end

  def init_knife_rb
    stack = Stack.new(@infra)
    output = JSON.parse(stack.outputs.first.output_value)

    # TODO: 直接~/.chef/下に鍵を作る path = Pathname.new(File.expand_path('~/.chef/'))
    #       開発環境で上書きされないようにするのはどうする?
    path = Rails.root.join('tmp', 'chef')
    FileUtils.mkdir_p(path) unless Dir.exist?(path)

    user_pem = path.join("#{User}.pem")
    File.write(user_pem, output[UserPemID])
    File.chmod(0600, user_pem)

    org_pem = path.join("#{Org}.pem")
    File.write(org_pem, output[OrgPemID])
    File.chmod(0600, org_pem)

    crt_path = path.join('trusted_certs')
    Dir.mkdir(crt_path) unless Dir.exist?(crt_path)
    File.write(crt_path.join("#{fqdn}.crt"), output[TrustedCertsPemID])


    File.open(path.join('knife.rb'), 'w') do |f|
      f.write <<-EOF
log_level                :info
log_location             STDOUT
node_name                '#{User}'
client_key               '~/.chef/#{User}.pem'
validation_client_name   '#{Org}-validator'
validation_key           '~/.chef/#{Org}.pem'
chef_server_url          '#{url}'
syntax_check_cache_path  '/home/#{EC2User}/.chef/syntax_check_cache'
      EOF
    end
  end

  def wait_init_ec2
    loop do
      begin
        exec_ssh(timeout: 5){}
      rescue
        sleep 10
        next
      else
        break
      end
    end
  end

  private

  def exec_ssh(opt = {}, &block)
    Net::SSH.start(fqdn, EC2User, {key_data: [@infra.ec2_private_key.value]}.merge(opt), &block)
  end
end
