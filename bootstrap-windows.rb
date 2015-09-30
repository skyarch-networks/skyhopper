#!/usr/bin/env/ruby

require 'socket'

# AWS API Credentials
# AWS_ACCESS_KEY_ID     = "AKIAIYPOCQWUGWEUGGDQ"
# AWS_SECRET_ACCESS_KEY = "WjRz3LbJaBq+i0Nn1vcQpRax9PRnZYWGlX9rpgD/"
#
# # Node details
NODE_NAME         = "webserver-01.example.com"
CHEF_ENVIRONMENT  = "production"
# INSTANCE_SIZE     = "t2.small"
# EBS_ROOT_VOL_SIZE = 30   # in GB
# REGION            = "ap-northeast-1"
# AVAILABILITY_ZONE = "ap-northeast-1c"
# AMI_NAME          = "ami-4623a846"
# SECURITY_GROUP    = "default"
RUN_LIST          = "role[base],role[iis]"
USER_DATA_FILE    = "/tmp/userdata.txt"
# USERNAME          = "Administrator"
PASSWORD          = "1234"
#
# Write user data file that sets up WinRM and sets the Administrator password.
File.open(USER_DATA_FILE, "w") do |f|
  f.write <<EOT
<script>
winrm quickconfig -q & winrm set winrm/config @{MaxTimeoutms="1800000"}
& winrm set winrm/config/service @{AllowUnencrypted="true"}
& winrm set winrm/config/service/auth @{Basic="true"}
& netsh advfirewall firewall add rule name="WinRM 5985"
protocol=TCP dir=in localport=5985 action=allow
& netsh advfirewall firewall add rule name="WinRM 5986"
protocol=TCP dir=in localport=5986 action=allow
</script>
<powershell>
$admin = [adsi]("WinNT://./administrator, user")
$admin.psbase.invoke("SetPassword", "#{PASSWORD}")
</powershell>
EOT
end

# Define the command to provision the instance
provision_cmd = [
  "knife ec2 server create",
  "--aws-access-key-id #{AWS_ACCESS_KEY_ID}",
  "--aws-secret-access-key #{AWS_SECRET_ACCESS_KEY}",
  "--tags 'Name=#{NODE_NAME}'",
  "--environment '#{CHEF_ENVIRONMENT}'",
  "--flavor #{INSTANCE_SIZE}",
  "--ebs-size #{EBS_ROOT_VOL_SIZE}",
  "--region #{REGION}",
  "--availability-zone #{AVAILABILITY_ZONE}",
  "--image #{AMI_NAME}",
  "--groups '#{SECURITY_GROUP}'",
  "--user-data #{USER_DATA_FILE}",
  "--ssh-key 'joeper'",
  "--verbose"
].join(" ")

# Run `knife ec2 server create` to provision the new instance and
# read the output until we know it's public IP address. At that point,
# knife is going to wait until the instance responds on the SSH port. Of
# course, being Windows, this will never happen, so we need to go ahead and
# kill knife and then proceed with the rest of this script to wait until
# WinRM is up and we can bootstrap the node with Chef over WinRM.
ip_addr = nil
IO.popen(provision_cmd) do |pipe|
  begin
    while line = pipe.readline
      puts line
      if line =~ /^Public IP Address: (.*)$/
        ip_addr = $1.strip
        Process.kill("TERM", pipe.pid)
        break
      end
    end
  rescue EOFError
    # done
  end
end
if ip_addr.nil?
  puts "ERROR: Unable to get new instance's IP address"
  exit -1
end

# Now the new instance is provisioned, but we have no idea when it will
# be ready to go. The first thing we'll do is wait until the WinRM port
# responds to connections.
puts ip_addr
puts "Waiting for WinRM..."
start_time = Time.now
begin
  s = TCPSocket.new ip_addr, 5985
rescue Errno::ETIMEDOUT => e
  puts "Still waiting..."+e.to_s
  retry
end
s.close
#
# # You'd think we'd be good to go now...but NOPE! There is still more Windows
# # bootstrap crap going on, and we have no idea what we need to wait on. So,
# # in a last-ditch effort to make this all work, we've seen that 120 seconds
# # ought to be enough...
# wait_time = 120
# while wait_time > 0
#   puts "Better wait #{wait_time} more seconds..."
#   sleep 1
#   wait_time -= 1
# end
# puts "Finally ready to try bootstrapping instance..."

# Define the command to bootstrap the already-provisioned instance with Chef
bootstrap_cmd = [
  "knife bootstrap windows winrm #{ip_addr}",
  "-x Administrator",
  "-P '8aUNWBR@GLE'",
  "--environment #{CHEF_ENVIRONMENT}",
  "--node-name #{NODE_NAME}",
  "--verbose"
].join(' ')

# Now we can bootstrap the instance with Chef and the configured run list.
status = system(bootstrap_cmd) ? 0 : -1
exit status
