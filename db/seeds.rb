# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

# -------------------- Cloud Providers
CloudProvider.find_or_create_by(id: 1, name: 'AWS')
CloudProvider.find_or_create_by(id: 2, name: 'nifty')


# -------------------- master-monitoring
# TODO: keyを埋める
MasterMonitoring.delete_all
[
  {id: 1,  name: 'CPU',          item: 'system.cpu.util[,total,avg1]', trigger_expression: '{HOSTNAME:system.cpu.util[,total,avg1].last(0)}>', is_common: false},
  {id: 2,  name: 'RAM',          item: 'vm.memory.size[available]',    trigger_expression: '{HOSTNAME:vm.memory.size[available].last(0)}<',    is_common: false},
  {id: 3,  name: 'LOAD AVERAGE', item: 'system.cpu.load[percpu,avg1]', trigger_expression: '{HOSTNAME:system.cpu.load[percpu,avg1].avg(5m)}>', is_common: false},
  {id: 4,  name: 'SWAP',         item: 'system.swap.size[,pfree]',     trigger_expression: '{HOSTNAME:system.swap.size[,pfree].last(0)}<',     is_common: false},
  {id: 5,  name: 'HTTP',         item: 'net.tcp.service[http]',        trigger_expression: '{HOSTNAME:net.tcp.service[http].max(#3)}=',        is_common: false},
  {id: 6,  name: 'SMTP',         item: 'net.tcp.service[smtp]',        trigger_expression: '{HOSTNAME:net.tcp.service[smtp].max(#3)}=',        is_common: false},
  {id: 7,  name: 'URL',          item: nil,                            trigger_expression: nil,                                                is_common: true},
  {id: 8,  name: 'MySQL',        item: 'mysql.login',                  trigger_expression: nil,                                                is_common: false},
  {id: 9,  name: 'PostgreSQL',   item: 'postgresql.login',             trigger_expression: nil,                                                is_common: false}
].each do |x|
  MasterMonitoring.create!(x)
end

# -------------------- Global Serverspecs
Serverspec.find_or_create_by(infrastructure_id: nil, name: 'recipe_apache2', value: <<-EOS)
require "serverspec_helper"

describe package('httpd') do
  it { should be_installed }
end

describe service('httpd') do
  it { should be_enabled }
  it { should be_running }
end

describe port(80) do
  it { should be_listening }
end
EOS

Serverspec.find_or_create_by(infrastructure_id: nil, name: 'recipe_php', value: <<-EOS)
require "serverspec_helper"

describe package("php") do
  it { should be_installed }
end
EOS



# ----------------------- System Client, Projects
client_skyhopper = Client.for_system
if client_skyhopper.blank?
  client_skyhopper = Client.create(name: Client::ForSystemCodeName, code: Client::ForSystemCodeName)
end
aws = CloudProvider.aws
Project.find_or_create_by(client: client_skyhopper, name: Project::ForDishTestCodeName,   code: Project::ForDishTestCodeName,   access_key: DummyText, secret_access_key: DummyText, cloud_provider: aws)
Project.find_or_create_by(client: client_skyhopper, name: Project::ChefServerCodeName,    code: Project::ChefServerCodeName,    access_key: DummyText, secret_access_key: DummyText, cloud_provider: aws)
Project.find_or_create_by(client: client_skyhopper, name: Project::ZabbixServerCodeName,  code: Project::ZabbixServerCodeName,  access_key: DummyText, secret_access_key: DummyText, cloud_provider: aws)


# ----------------------- Global CF template
template_paths = Dir.glob(Rails.root.join('lib/erb-builder/template/presets/')).sort
template_paths.each do |path|
  n = File.basename(path, '.erb')
  b = ERB::Builder.new(n)

  value = b.build
  name = n.gsub('_', ' ')
  parsed = JSON.parse(value)
  detail = parsed['Description']

  CfTemplate.delete_all(name: name)
  CfTemplate.create(name: name, detail: detail, value: value)
end
