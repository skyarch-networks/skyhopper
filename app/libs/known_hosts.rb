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

    private

    def known_hosts_path
      File.expand_path('~/.ssh/known_hosts')
    end

    def init_ssh_dir
      ssh_dir = File.expand_path('~/.ssh')
      Dir.mkdir(ssh_dir, 0o700) unless Dir.exist?(ssh_dir)

      File.open(known_hosts_path, mode: 'w', perm: 0o600).close unless File.exist?(known_hosts_path)
    end

    def exec_command(command)
      out, err, status = Open3.capture3(command)
      raise CommandNotSuccessError unless status.success?

      out
    end
  end
end
