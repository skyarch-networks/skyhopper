require "tempfile"
require "yaml"
require 'shellwords'
require 'open3'

module Ansible
  class CommandNotSuccessError < ::RuntimeError; end

  def self.exec_command(command, &block)
    Open3.popen3(command) do |stdin, stdout, stderr, wait_thr|
      while line = stdout.gets
        line.chomp!
        block.call(line)
      end
      raise CommandNotSuccessError unless wait_thr.value.success?
    end
    return true
  end

  def self.create(ansible_workspace_path, target_hosts, become=true)
    Tempfile.create('playbook-', ansible_workspace_path) do |playbook_file|
      yield(Client.new(playbook_file, ansible_workspace_path, target_hosts, become))
    end
  end

  def self.get_roles(ansible_workspace_path)
    ansible = Client.new(nil, ansible_workspace_path, nil)
    return ansible.roles
  end

  # 正しければtrue、正しくなければfalseが返る
  def self.verify_roles(roles)
    return false unless roles.is_a?(Array)
    roles.each do |role|
      return false unless role.is_a?(String)
    end
    return true
  end

  class Client
    ROLE_DIRECTYORY_NAME = 'roles'
    ROLE_MAIN_FILE_PATH_REGEX = /^[^\/]+\/([^\/]*\/)*tasks\/main.yml$/

    def initialize(playbook_file, ansible_workspace_path, target_hosts, become=true)
      @playbook_file = playbook_file
      @ansible_workspace_path = ansible_workspace_path
      @playbook_data = [{
                          'hosts' => target_hosts,
                          'become' => become,
                          'roles' => roles,
                        }]
    end

    def roles
      roles_path = "#{@ansible_workspace_path}/#{ROLE_DIRECTYORY_NAME}"
      Dir.glob("#{roles_path}/**/main.yml").map {|path|
        # roles_pathから見た相対パスに変換
        relative_path_length = path.length - roles_path.length - 1
        relative_path = path[-relative_path_length, relative_path_length]

        # ロールのmain.ymlで絞り込み
        match = ROLE_MAIN_FILE_PATH_REGEX.match(relative_path)
        if match.nil?
          next nil
        end

        # ファイルかどうか確認
        unless File.file?(path)
          next nil
        end

        # ロール名のみに変換
        role_name_path_array = relative_path.split('/')
        role_name_path_array.pop
        role_name_path_array.pop
        role_name_path_array.join('/')
      }.compact.sort
    end

    def set_roles(roles)
      @playbook_data[0]['roles'] = roles
      write_playbook
    end

    def write_playbook
      playbook_text = @playbook_data.to_yaml
      File.open(@playbook_file.path, 'w') do |f|
        f.write(playbook_text)
      end
    end

    def run(options = {}, &block)
      hosts_path = options[:hosts_path]
      private_key_path = options[:private_key_path]
      extra_vars = options[:extra_vars]
      command = "ansible-playbook #{Shellwords.escape(@playbook_file.path)}"
      command += " -i #{Shellwords.escape(hosts_path)}" unless hosts_path.nil?
      command += " --private-key=#{Shellwords.escape(private_key_path)}" unless private_key_path.nil?
      command += " --extra-vars=#{Shellwords.escape(extra_vars)}" unless extra_vars.nil?
      Ansible.exec_command(command, &block)
    end
  end
end
