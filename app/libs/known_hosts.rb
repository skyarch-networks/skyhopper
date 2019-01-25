require 'net/ssh'
require 'open3'

module KnownHosts
  class CommandNotSuccessError < ::RuntimeError; end

  class << self
    def exist?(domain_name)
      return false if domain_name.empty?
      found_known_hosts = ::Net::SSH::KnownHosts.search_for(domain_name)
      return !found_known_hosts.empty?
    end

    def scan_and_add_keys(domain_name)
      command  = "ssh-keyscan -H #{Shellwords.escape(domain_name)}>> ~/.ssh/known_hosts"
      exec_command(command)
    end

    private

    def exec_command(command)
      out, err, status = Open3.capture3(command)
      raise CommandNotSuccessError unless status.success?
      return out
    end
  end
end
