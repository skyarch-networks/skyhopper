require 'open3'

module KnownHosts
  class CommandNotSuccessError < ::RuntimeError; end

  class << self
    def scan_and_add_keys(domain_name)
      keys = scan_keys(domain_name)
      return false if keys.empty?

      add_keys(keys)
      true
    end

    def scan_and_update_keys(domain_name)
      delete_keys(domain_name)
      scan_and_add_keys(domain_name)
    end

    def match_remote_key?(domain_name)
      keys = scan_keys(domain_name)
      includes_keys_partial?(domain_name, keys)
    end

    private

    def known_hosts_path
      File.expand_path('~/.ssh/known_hosts')
    end

    def init_ssh_dir
      ssh_dir = File.expand_path('~/.ssh')
      Dir.mkdir(ssh_dir, 0o700) unless Dir.exist?(ssh_dir)

      File.open(known_hosts_path, mode: 'w', perm: 0o600).close unless File.exist?(known_hosts_path)
    end

    def includes_keys_partial?(domain_name, keys)
      raise ::ArgumentError, '"keys" is allow only Array' unless keys.is_a?(Array)

      pub_keys = keys.map do |known_host_line|
        pub_key_part(known_host_line)
      end

      init_ssh_dir
      File.open(known_hosts_path, mode: 'r') do |file|
        file.each_line do |line|
          return true if pub_keys.any? { |pub_key| line.include?(domain_name) && line.include?(pub_key) }
        end
      end
      false
    end

    def scan_keys(domain_name)
      command = "ssh-keyscan #{Shellwords.escape(domain_name)}"
      result = exec_command(command)
      result.split("\n")
    end

    def add_keys(keys)
      append_text = keys.map { |key| "#{key}\n" }.join

      init_ssh_dir
      File.open(known_hosts_path, mode: 'a') do |file|
        file.flock(File::LOCK_EX)
        file.puts(append_text)
        file.flock(File::LOCK_UN)
      end
    end

    def delete_keys(domain_name)
      command = "ssh-keygen -R #{Shellwords.escape(domain_name)}"
      exec_command(command)
    end

    def pub_key_part(known_host_line)
      # known_host_line example: domain_name_or_ip1,domain_name_or_ip2 ssh-rsa XXXXXXXXXX
      known_host_line.split(nil).last
    end

    def exec_command(command)
      out, _err, status = Open3.capture3(command)
      raise CommandNotSuccessError unless status.success?

      out
    end
  end
end
