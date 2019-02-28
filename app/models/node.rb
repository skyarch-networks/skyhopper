#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Node

  ChefDefaultUser = "ec2-user".freeze
  WaitSearchIndexInterval = 5
  AnsibleWorkspacePath = Rails.root.join('ansible').to_s
  AnsibleTargetHostName = 'ec2'.freeze

  class BootstrapError < ::StandardError; end
  class CookError < ::StandardError; end
  class ServerspecError < ::StandardError; end

  def self.exec_command(command, ex_class=RuntimeError)
    out, err, status = Open3.capture3(command)
    unless status.success?
      raise ex_class, out + err
    end
    return out, err, status
  end

  def initialize(name, user: ChefDefaultUser)
    @name = name
    @user = user
  end
  attr_reader :name

  # node.run_ansible_playbook do |line|
  #   # line is ansible-playbook log
  # end
  def run_ansible_playbook(infra, playbook_roles, extra_vars, &block)
    ec2key = infra.ec2_private_key
    ec2key.output_temp(prefix: @name)

    hosts_file = Tempfile.open(@name)
    hosts_file.print(ansible_hosts_text(infra))
    hosts_file.flush

    Ansible::create(AnsibleWorkspacePath, AnsibleTargetHostName) do |ansible|
      ansible.set_roles(playbook_roles)
      begin
        ansible.run(
          hosts_path: hosts_file.path,
          private_key_path: ec2key.path_temp,
          extra_vars: extra_vars
        ) do |line|
          block.call(line)
        end
      end
    end
  ensure
    ec2key.close_temp
    hosts_file.close! if hosts_file
  end

  # serverspec_ids => ServerspecのidのArray
  def run_serverspec(infra_id, servertest_ids)
    # get params
    infra = Infrastructure.find(infra_id)
    ec2key = infra.ec2_private_key
    ec2key.output_temp(prefix: @name)

    raise ServerspecError, 'specs is empty' if servertest_ids.empty?

    fqdn = infra.instance(@name).fqdn

    run_spec_list = Servertest.where(id: servertest_ids).map{|servertest|
      screen_name = servertest.name
      screen_name << " (#{servertest.description})" if servertest.description.present?
      path = ::Servertest.to_file(servertest.id)
      {
        name: screen_name,
        path: path,
        file: get_relative_path_string(path)
      }
    }

    ruby_cmd = File.join(RbConfig::CONFIG['bindir'],  RbConfig::CONFIG['ruby_install_name'])

    cmd = []
    cmd << "SSHKeyPath=#{ec2key.path_temp}"
    cmd << "User=#{@user}"
    cmd << "FQDN=#{fqdn}"
    cmd << ruby_cmd << '-S rspec' << "-I #{Rails.root.join('serverspec', 'spec')}"
    cmd << run_spec_list.map{|run_spec|run_spec[:path]}.join(' ').to_s
    cmd << '--format ServerspecDebugFormatter --require ./serverspec/formatters/serverspec_debug_formatter.rb'
    cmd = cmd.flatten.reject(&:blank?).join(" ")

    begin
      out, = self.class.exec_command(cmd, ServerspecError)
    rescue ServerspecError => ex
      out = ex.to_s
    end

    # create result
    result =  generate_result(out)
    resource_status = (result[:status_text] == 'error') ? 'failed' : result[:status_text]
    Resource.find_by(physical_id: @name).status.servertest.update(value: resource_status)

    result[:error_servertest_names] = get_error_servertest_names(result, run_spec_list)

    return result
  rescue => ex
    Resource.find_by(physical_id: @name).status.servertest.failed!
    raise ex
  ensure
    ec2key.close_temp

    FileUtils::rm_rf(run_spec_list.map{|run_spec|run_spec[:path]})
  end


  def yum_update(infra, security=false, exec=false, &block)
    cmd = "sudo yum "

    cmd << "-y update " if exec
    cmd << "check-update " unless exec

    cmd << "--security " if security

    cmd << "| cat" unless exec

    exec_knife_ssh(cmd, infra, &block)
  end



  private

  # @param [String] fqdn
  def scp_specs(sshkey_path, fqdn)
    d = details
    remote_path =
      begin
        d['override']['serverspec-handler']['output_dir'] or d['default']['serverspec-handler']['output_dir']
      rescue NoMethodError
        d['default']['serverspec-handler']['output_dir']
      end

    Dir::mkdir(Servertest::TmpDir) unless Dir::exist?(Servertest::TmpDir)
    local_path = Dir::mktmpdir(nil, Servertest::TmpDir)

    Net::SCP.start(fqdn, @user, keys: sshkey_path) do |scp|
      scp.download!(remote_path, local_path, recursive: true)
    end

    # TODO: 現在 scp したファイルを書き換えているため、もう少しよい方法を探る
    Dir::glob(File::join(local_path, '**/*_spec.rb')).each do |f|
      File::open(f, 'r+') do |g|
        g.readline
        val = "require 'serverspec_helper'" + g.read
        g.rewind
        g.write(val)
        g.truncate(g.tell)
      end
    end
    Rails.logger.debug("scp from #{remote_path} to #{local_path}")
    local_path
  end

  # ==== Args
  # [command] String 実行するコマンド
  # [infra] Infrastructure
  # ==== Block
  # [Args] String コマンドの出力1行ごと
  # ==== Raise
  # CookError
  # ==== Return
  # boolean
  def exec_knife_ssh(command, infra)
    ec2key = infra.ec2_private_key
    ec2key.output_temp(prefix: @name)
    fqdn = infra.instance(@name).fqdn

    cmd = "ssh #{@user}@#{fqdn} -t -t -i #{ec2key.path_temp} #{command}"

    Open3.popen3(cmd) do |_stdin, stdout, stderr, w|
      while line = stdout.gets
        line.chomp!

        yield line
      end

      Rails.logger.warn(stderr.read)
      raise CookError unless w.value.success?
    end

    return true
  ensure
    ec2key.close_temp
  end

  def exec_knife_winrm(command, infra)
    ec2key = infra.ec2_private_key
    ec2key.output_temp(prefix: @name)
    fqdn = infra.instance(@name).fqdn
    password = infra.instance(@name).password(ec2key)

    cmd = "knife winrm #{fqdn} --winrm-user Administrator  --winrm-password '#{password}' #{command} --winrm-transport ssl --winrm-ssl-verify-mode verify_none"

    Open3.popen3(cmd) do |_stdin, stdout, stderr, w|
      while line = stdout.gets
        line.chomp!

        yield line
      end

      Rails.logger.warn(stderr.read)
      raise CookError unless w.value.success?
    end

    return true
  # ensure
  #   ec2key.close_temp
  end

  def generate_result(out)
    result = JSON::parse(out, symbolize_names: true)
    result[:examples].each do |e|
      e[:exception].delete(:backtrace) if e[:exception]
    end
    result[:status] = result[:summary][:failure_count].zero? && result[:summary][:errors_outside_of_examples_count].zero?
    result[:status_text] =
      if result[:status]
        if result[:summary][:pending_count].zero?
          'success'
        else
          'pending'
        end
      else
        if result[:summary][:errors_outside_of_examples_count].zero?
          'failed'
        else
          'error'
        end
      end


    case result[:status_text]
      when 'pending'
        result[:message] = result[:examples].select{|x| x[:status] == 'pending'}.map{|x| "#{x[:full_description]}\n#{x[:pending_message]}"}.join("\n")
        result[:short_msg] = result[:examples].select{|x| x[:status] == 'failed'}.map{|x| x[:full_description]}.join("\n")
      when 'failed'
        result[:message] = result[:examples].select{|x| x[:status] == 'failed'}.map{|x| "#{x[:full_description]}\n#{x[:command]}¥n#{x[:exception][:message]}"}.join("\n")
        result[:short_msg] = result[:examples].select{|x| x[:status] == 'failed'}.map{|x| x[:full_description]}.join("\n")
    end

    result[:long_message] = result[:examples].map{|example|
      message = example[:status] + "\n"
      message += example[:full_description] + "\n"
      unless example[:command].nil?
        message += example[:command] + "\n"
      end
      if example[:status] == 'pending'
        message += example[:pending_message] + "\n"
      elsif example[:status] == 'failed'
        message += example[:exception][:message] + "\n"
      end
      message
    }.join("\n")
    result[:long_message] += "\n" + result[:summary_line]

    return result
  end

  def get_error_servertest_names(result, run_spec_list)
    if result[:messages].nil?
      return []
    end
    error_servertest_names = []
    result[:messages].each do |message|
      match = /^An error occurred while loading (.+)\.$/.match(message)
      unless match
        next
      end
      error_servertest_names.concat(run_spec_list.select{|run_spec|
        run_spec[:file] == match[1]
      }.map{|run_spec|
        run_spec[:name]
      })
    end
    error_servertest_names
  end

  def get_relative_path_string(path_string)
    path_from = Rails.root
    path_to = Pathname(path_string)
    './' + path_to.relative_path_from(path_from).to_s
  end

  def ansible_hosts_text(infra)
    <<"EOS"
[#{AnsibleTargetHostName}]
#{infra.instance(@name).fqdn} ansible_ssh_user=#{@user}
EOS
  end

end
