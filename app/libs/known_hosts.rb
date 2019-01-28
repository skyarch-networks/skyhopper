require 'net/ssh'
require 'open3'

module KnownHosts
  class CommandNotSuccessError < ::RuntimeError; end

  class << self
    def scan_and_add_keys(domain_name)
      init_ssh_dir

      command  = "ssh-keyscan -H #{Shellwords.escape(domain_name)}>> ~/.ssh/known_hosts"
      exec_command(command)
    end

    private

    def init_ssh_dir
      ssh_dir = File.expand_path('~/.ssh')
      Dir.mkdir(ssh_dir, perm: 0700) unless Dir.exist?(ssh_dir)

      known_hosts_path = File.expand_path('~/.ssh/known_hosts')
      File.open(known_hosts_path, mode: 'w', perm: 0600).close() unless File.exist?(known_hosts_path)
    end

    def exec_command(command)
      out, err, status = Open3.capture3(command)
      raise CommandNotSuccessError unless status.success?
      return out
    end
  end
end
