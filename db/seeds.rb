# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

# -------------------- master-monitoring
# TODO: keyを埋める
MasterMonitoring.delete_all
[
  { id: 1,  name: 'CPU',          item: 'system.cpu.util[,total,avg1]', trigger_expression: '{HOSTNAME:system.cpu.util[,total,avg1].last(0)}>', is_common: false },
  { id: 2,  name: 'RAM',          item: 'vm.memory.size[available]',    trigger_expression: '{HOSTNAME:vm.memory.size[available].last(0)}<',    is_common: false },
  { id: 3,  name: 'LOAD AVERAGE', item: 'system.cpu.load[percpu,avg1]', trigger_expression: '{HOSTNAME:system.cpu.load[percpu,avg1].avg(5m)}>', is_common: false },
  { id: 4,  name: 'SWAP',         item: 'system.swap.size[,pfree]',     trigger_expression: '{HOSTNAME:system.swap.size[,pfree].last(0)}<',     is_common: false },
  { id: 5,  name: 'HTTP',         item: 'net.tcp.service[http]',        trigger_expression: '{HOSTNAME:net.tcp.service[http].max(#3)}=',        is_common: false },
  { id: 6,  name: 'SMTP',         item: 'net.tcp.service[smtp]',        trigger_expression: '{HOSTNAME:net.tcp.service[smtp].max(#3)}=',        is_common: false },
  { id: 7,  name: 'URL',          item: nil,                            trigger_expression: nil,                                                is_common: true },
  { id: 8,  name: 'MySQL',        item: 'mysql.login',                  trigger_expression: nil,                                                is_common: false },
  { id: 9,  name: 'PostgreSQL',   item: 'postgresql.login',             trigger_expression: nil,                                                is_common: false },
].each do |x|
  MasterMonitoring.create!(x)
end

# -------------------- Global Serverspecs
Servertest.find_or_create_by(infrastructure_id: nil, name: 'recipe_apache2', category: :serverspec, value: <<~SERVERTEST)
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
SERVERTEST

Servertest.find_or_create_by(infrastructure_id: nil, name: 'recipe_php', category: :serverspec, value: <<~SERVERTEST)
  require "serverspec_helper"

  describe package("php") do
    it { should be_installed }
  end
SERVERTEST

# -------------------- Global AWSspecs
Servertest.find_or_create_by(infrastructure_id: nil, name: 'recipe_apache2', category: :awspec, value: <<~SERVERTEST)
  require "awsspec_helper"

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
SERVERTEST

Servertest.find_or_create_by(infrastructure_id: nil, name: 'recipe_php', category: :awspec, value: <<~SERVERTEST)
  require "awsspec_helper"

  describe package("php") do
    it { should be_installed }
  end
SERVERTEST

# ----------------------- System Client, Projects
client_skyhopper = Client.for_system
if client_skyhopper.blank?
  client_skyhopper = Client.create(name: Client::FOR_SYSTEM_CODE_NAME, code: Client::FOR_SYSTEM_CODE_NAME)
end
Project.find_or_create_by(client: client_skyhopper, name: Project::FOR_DISH_TEST_CODE_NAME, code: Project::FOR_DISH_TEST_CODE_NAME, access_key: DUMMY_TEXT, secret_access_key: DUMMY_TEXT)
Project.find_or_create_by(client: client_skyhopper, name: Project::CHEF_SERVER_CODE_NAME,    code: Project::CHEF_SERVER_CODE_NAME,    access_key: DUMMY_TEXT, secret_access_key: DUMMY_TEXT)
Project.find_or_create_by(client: client_skyhopper, name: Project::ZABBIX_SERVER_CODE_NAME,  code: Project::ZABBIX_SERVER_CODE_NAME,  access_key: DUMMY_TEXT, secret_access_key: DUMMY_TEXT)

# ----------------------- Global CF template
template_paths = Dir.glob(Rails.root.join('lib', 'erb-builder', 'templates', 'presets', '*')).sort
template_paths.each do |path|
  n = File.basename(path, '.json.erb')
  b = ERB::Builder.new('presets/' + n)

  value = b.build
  name = n.tr('_', ' ')
  parsed = JSON.parse(value)
  detail = parsed['Description']

  CfTemplate.where(name: name, format: 'JSON', infrastructure_id: nil).delete_all
  CfTemplate.create(name: name, format: 'JSON', detail: detail, value: value)
end
