require 'aws_spec_helper'

describe ec2('Zabbix Server 3.0.4-1') do
  it { should exist }
  it { should be_running }
  its(:instance_id) { should eq 'i-c8e61146' }
  its(:image_id) { should eq 'ami-1a15c77b' }
  its(:private_dns_name) { should eq 'ip-172-31-9-112.ap-northeast-1.compute.internal' }
  its(:public_dns_name) { should eq 'ec2-54-238-244-215.ap-northeast-1.compute.amazonaws.com' }
  its(:instance_type) { should eq 't2.small' }
  its(:private_ip_address) { should eq '172.31.9.112' }
  its(:public_ip_address) { should eq '54.238.244.215' }
  it { should have_security_group('SkyHopperZabbixServer-617281f7f19b739dc7ca39203c8ec07d-SecurityGroup-WMUFHWHJ2UP6') }
  it { should belong_to_vpc('vpc-6e5cf50b') }
  it { should belong_to_subnet('subnet-ba3be4e3') }
  it { should have_ebs('vol-7c0e9bc7') }
end

describe ec2('Chef Server') do
  it { should exist }
  it { should be_running }
  its(:instance_id) { should eq 'i-e6876178' }
  its(:image_id) { should eq 'ami-f80e0596' }
  its(:private_dns_name) { should eq 'ip-172-31-24-152.ap-northeast-1.compute.internal' }
  its(:public_dns_name) { should eq 'ec2-52-198-113-237.ap-northeast-1.compute.amazonaws.com' }
  its(:instance_type) { should eq 't2.small' }
  its(:private_ip_address) { should eq '172.31.24.152' }
  its(:public_ip_address) { should eq '52.198.113.237' }
  it { should have_security_group('SkyHopperChefServer-5e0900dab30d221b906e85cc5ba7048c-SecurityGroup-I2J3K6E3SSAY') }
  it { should belong_to_vpc('vpc-6e5cf50b') }
  it { should belong_to_subnet('subnet-9f8307e8') }
  it { should have_eip('52.198.113.237') }
  it { should have_ebs('vol-467787b7') }
end

describe ec2('Zabbix Server') do
  it { should exist }
  it { should be_running }
  its(:instance_id) { should eq 'i-e7876179' }
  its(:image_id) { should eq 'ami-f80e0596' }
  its(:private_dns_name) { should eq 'ip-172-31-28-69.ap-northeast-1.compute.internal' }
  its(:public_dns_name) { should eq 'ec2-52-198-216-189.ap-northeast-1.compute.amazonaws.com' }
  its(:instance_type) { should eq 't2.micro' }
  its(:private_ip_address) { should eq '172.31.28.69' }
  its(:public_ip_address) { should eq '52.198.216.189' }
  it { should have_security_group('SkyHopperZabbixServer-fae3fae432255fc8dcdd4fdf5d87904c-SecurityGroup-DDSEWW5QVS6G') }
  it { should belong_to_vpc('vpc-6e5cf50b') }
  it { should belong_to_subnet('subnet-9f8307e8') }
  it { should have_eip('52.198.216.189') }
  it { should have_ebs('vol-477787b6') }
end

describe ec2('EC2 Instance') do
  it { should exist }
  it { should be_running }
  its(:instance_id) { should eq 'i-758563eb' }
  its(:image_id) { should eq 'ami-f80e0596' }
  its(:private_dns_name) { should eq 'ip-172-31-16-170.ap-northeast-1.compute.internal' }
  its(:public_dns_name) { should eq 'ec2-52-198-221-231.ap-northeast-1.compute.amazonaws.com' }
  its(:instance_type) { should eq 't2.micro' }
  its(:private_ip_address) { should eq '172.31.16.170' }
  its(:public_ip_address) { should eq '52.198.221.231' }
  it { should have_security_group('default') }
  it { should belong_to_vpc('vpc-6e5cf50b') }
  it { should belong_to_subnet('subnet-9f8307e8') }
  it { should have_eip('52.198.221.231') }
  it { should have_ebs('vol-9d7b8b6c') }
end

describe ec2('SKyhopper MArketplace AMI') do
  it { should exist }
  it { should be_running }
  its(:instance_id) { should eq 'i-7ccf38f2' }
  its(:image_id) { should eq 'ami-bd2df0dc' }
  its(:private_dns_name) { should eq 'ip-172-31-12-175.ap-northeast-1.compute.internal' }
  its(:public_dns_name) { should eq 'ec2-54-238-201-55.ap-northeast-1.compute.amazonaws.com' }
  its(:instance_type) { should eq 't2.small' }
  its(:private_ip_address) { should eq '172.31.12.175' }
  its(:public_ip_address) { should eq '54.238.201.55' }
  it { should have_security_group('default') }
  it { should belong_to_vpc('vpc-6e5cf50b') }
  it { should belong_to_subnet('subnet-ba3be4e3') }
  it { should have_ebs('vol-61d94dda') }
end
