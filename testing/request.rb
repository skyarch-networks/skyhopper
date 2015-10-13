require 'socket'

AWS_ACCESS_KEY_ID     = "AKIAIYPOCQWUGWEUGGDQ"
AWS_SECRET_ACCESS_KEY = "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"
#
# # Node details
NODE_NAME         = "i-a94a3a0b"
# CHEF_ENVIRONMENT  = "production"
INSTANCE_SIZE     = "t2.small"
EBS_ROOT_VOL_SIZE = 30   # in GB
REGION            = "ap-northeast-1"
AVAILABILITY_ZONE = "ap-northeast-1c"
AMI_NAME          = "ami-4623a846"
SECURITY_GROUP    = "default"
RUN_LIST          = "role[base],role[iis]"
USER_DATA_FILE    = "/tmp/userdata.txt"
USERNAME          = "Administrator"
PASSWORD          = "W6ccxK@5jye"

ip_addr = '52.69.142.168'


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
puts "Finally ready to try bootstrapping instance..."
#
# Define the command to bootstrap the already-provisioned instance with Chef
bootstrap_cmd = [
  "knife bootstrap windows winrm #{ip_addr}",
  "-x Administrator",
  "-P '#{PASSWORD}'",
  "--node-name #{NODE_NAME}",
  "--verbose"
].join(' ')

# Now we can bootstrap the instance with Chef and the configured run list.
status = system(bootstrap_cmd) ? 0 : -1
exit status
