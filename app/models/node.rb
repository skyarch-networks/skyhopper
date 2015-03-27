#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'tempfile'
require 'open3'
require 'fileutils'
require 'net/scp'
require 'tmpdir'
require 'rbconfig'

class Node
  include ::Node::Attribute

  ChefDefaultUser = "ec2-user"
  SSHConnectionAttribute = "public_dns" # to set ec2 (or others) public dns
  WaitSearchIndexInterval = 5

  class BootstrapError < ::StandardError; end
  class CookError < ::StandardError; end
  class ServerspecError < ::StandardError; end

  def self.exec_command(command, ex_class=RuntimeError)
    out, err, status = Open3.capture3(command)
    unless status.success?
      Rails.logger.error <<-EOS
command: #{command}
status: #{status}
out:
#{out}
err:
#{err}
      EOS
      raise ex_class, out + err
    end
    return out, err, status
  end

  # knife bootstrap を実行し、Chef ServerにNodeを登録する。
  # ==== Args
  # [fqdn] {String} 対象のNodeのfqdn
  # [node_name] {String} Nodeを一意に決定する名前。EC2のphysical_idを使用する。
  # [infra] {Infrastructure} Nodeが紐づくInfrastructure
  # [user] {String} ssh接続に使用するユーザー。デフォルトで ec2-user が使用される。
  # [chef_client_version] {String} Chef client のバージョン
  # ==== return
  # {Node} Node class のインスタンスを作成して返す。
  def self.bootstrap(fqdn, node_name, infra, user: nil, chef_client_version: nil)
    user ||= ChefDefaultUser

    ec2key = infra.ec2_private_key
    ec2key.output_temp(prefix: node_name)

    cmd = <<-EOS
knife bootstrap #{fqdn} \
--identity-file #{ec2key.path_temp} \
--ssh-user #{user} \
--node-name #{node_name} \
--json-attributes '{"#{SSHConnectionAttribute}":"#{fqdn}"}' \
--sudo
    EOS
    if chef_client_version
      cmd.chomp!
      cmd.concat(" --bootstrap-version #{chef_client_version}")
    end
    exec_command(cmd, BootstrapError)

    return self.new(node_name)
  ensure
    ec2key.close_temp
  end

  def initialize(name, user: nil)
    @name = name
    @user = user || ChefDefaultUser
  end
  attr_reader :name

  # memo化される
  def details
    @details ||= ChefAPI.details('node', @name)
  end

  def delete
    ChefAPI.destroy('node', @name)
    ChefAPI.destroy('client', @name)
  end

  def update_runlist(runlist)
    n = ChefAPI.find(:node, @name)
    n.run_list = runlist
    n.save
  end

  # node.cook do |line|
  #   # line is chef-clinet log
  # end
  def cook(infra, &block)
    exec_knife_ssh('sudo chef-client', infra, &block)
  end

  def wait_search_index
    sleep WaitSearchIndexInterval while ChefAPI.search_node(@name).empty?
  end

  # for serverspec
  def have_auto_generated
    have_recipes?(%w{recipe[serverspec-handler::default] recipe[serverspec-handler]})
  end

  # recipe が適用されているかを返す。
  def have_recipes?(recipes)
    recipes = [recipes] unless recipes.kind_of?(Array)
    (all_recipe & recipes).present?
  end

  def have_roles?(roles)
    roles = [roles] unless roles.kind_of?(Array)
    (all_role & roles).present?
  end

  # serverspec_ids => ServerspecのidのArray
  def run_serverspec(infra_id, serverspec_ids, selected_auto_generated)
    # get params
    infra = Infrastructure.find(infra_id)
    ec2key = infra.ec2_private_key
    ec2key.output_temp(prefix: @name)

    raise ServerspecError, 'specs is empty' if serverspec_ids.empty? and ! selected_auto_generated

    if selected_auto_generated
      local_path = scp_specs(ec2key.path_temp)
    end

    run_spec_list_path = serverspec_ids.map do |spec|
      ::Serverspec.to_file(spec)
    end

    ruby_cmd = File.join(RbConfig::CONFIG['bindir'],  RbConfig::CONFIG['ruby_install_name'])

    cmd = []
    cmd << "SSHKeyPath=#{ec2key.path_temp}"
    cmd << "User=#{@user}"
    cmd << "FQDN=#{fqdn}"
    cmd << ruby_cmd << '-S rspec' << "-I #{Rails.root.join('serverspec', 'spec')}"
    cmd << "#{run_spec_list_path.join(' ')}"
    cmd << local_path if selected_auto_generated
    cmd << '--format json'
    cmd = cmd.flatten.reject(&:blank?).join(" ")

    begin
      out, = self.class.exec_command(cmd, ServerspecError)
    rescue ServerspecError => ex
      out = ex.to_s
    end

    # create result
    result = JSON::parse(out, symbolize_names: true)
    result[:examples].each do |e|
      e[:exception].delete(:backtrace) if e[:exception]
    end
    Rails.logger.debug(result)
    result[:status] = result[:summary][:failure_count] == 0
    result[:status_text] = if result[:status]
      if result[:summary][:pending_count] == 0
        ServerspecStatus::Success
      else
        ServerspecStatus::Pending
      end
    else
      ServerspecStatus::Failed
    end
    Rails.cache.write(ServerspecStatus::TagName + @name, result[:status_text])
    return result
  ensure
    ec2key.close_temp

    FileUtils::rm_rf(run_spec_list_path) if run_spec_list_path
    if selected_auto_generated then
      FileUtils::rm_rf(local_path, secure: true)
    end
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

  # TODO: API request memoize
  def all_recipe(run_list = details['run_list'])
    @roles ||= {}
    recipes, roles = run_list.partition{|x| x[/^recipe/]}
    roles = roles.map {|role|
      role_name = role[/^role\[(.+)\]$/, 1]
      all_recipe(@roles[role_name] ||= ChefAPI.find(:role, role_name).run_list)
    }.flatten
    recipes.concat(roles)
  end

  # TODO: role が role を include している場合
  def all_role(run_list = details['run_list'])
    recipes, roles = run_list.partition{|x| x[/^recipe/]}

    roles
  end

  def fqdn
    if details["normal"] && details["normal"][SSHConnectionAttribute]
      return details["normal"][SSHConnectionAttribute]
    elsif automatic = details["automatic"]
      return automatic["fqdn"]
    else
      return nil
    end
  end

  def scp_specs(sshkey_path)
    d = details
    remote_path =
      begin
        d['override']['serverspec-handler']['output_dir'] or d['default']['serverspec-handler']['output_dir']
      rescue NoMethodError
        d['default']['serverspec-handler']['output_dir']
      end

    Dir::mkdir(Serverspec::TmpDir) unless Dir::exist?(Serverspec::TmpDir)
    local_path = Dir::mktmpdir(nil, Serverspec::TmpDir)

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

    cmd = <<-EOS
knife ssh \
'name:#{@name}' \
'#{command}' \
--identity-file #{ec2key.path_temp} \
--ssh-user #{@user} \
--attribute #{SSHConnectionAttribute}
    EOS

    IO.popen(cmd) do |io|
      while line = io.gets
        line.gsub!(/\x1b[^m]*m/, '')    # remove ANSI escape
        line.sub!(/^[^ ]+ /, '')       # remove hostname
        line.chomp!

        yield line
      end
      io.close

      status = $?.success?
      raise CookError unless status
    end
    return true


  ensure
    ec2key.close_temp
  end
end
