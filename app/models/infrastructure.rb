#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Infrastructure < ActiveRecord::Base
  before_destroy :detach_zabbix
  before_destroy :detach_chef

  belongs_to :project
  belongs_to :ec2_private_key, dependent: :delete

  has_many :infrastructure_logs, dependent: :delete_all
  has_many :serverspecs, dependent: :delete_all
  has_many :resources, dependent: :destroy
  has_many :monitorings, dependent: :delete_all
  has_many :master_monitorings, through: :monitorings

  delegate :client, to: :project

  # 将来的にproject_id もuniqueに含める?
  validates :stack_name, uniqueness: {
    scope: [:region],
  }
  validates :stack_name, format: {with: /\A[a-zA-Z][a-zA-Z0-9-]*$\z/}, length: {maximum: 128}

  class << self
    # @param [Hash{Symbol => String}] infra_params Same as Infrastructure#create
    # @raise Same as Infrastructure#create!
    # @return [Infrastructure] Created infra.
    def create_with_ec2_private_key!(infra_params)
      create!( create_ec2_private_key(infra_params) )
    end

    # @param [Hash{Symbol => String}] infra_params Same as Infrastructure#create
    # @return [Infrastructure] Created infra.
    def create_with_ec2_private_key(infra_params)
      create( create_ec2_private_key(infra_params) )
    end

    # Dish のテスト用の Infrastructure を作成して返す。
    # @param [Integer] project_id ID of Project.
    # @param [String] dish_name Name of Dish.
    # @return [Infrastructure] Created infra.
    def create_for_test(project_id, dish_name = "")
      setting = AppSetting.get
      stack_name = "validation-#{Digest::MD5.hexdigest(dish_name + DateTime.now.in_time_zone.to_s)}"

      copied = setting.ec2_private_key.dup
      copied.save!

      infrastructure = self.new(
        project_id:         project_id,
        stack_name:         stack_name,
        region:             setting.aws_region,
        ec2_private_key_id: copied.id
      )
      infrastructure.save!

      return infrastructure
    end


    private

    # @param [Hash{Symbol => String}] infra_params Same as Infrastructure#create
    # @return [Hash]
    def create_ec2_private_key(infra_params)
      infra_params[:ec2_private_key_id] =
        if infra_params[:keypair_name].present? && infra_params[:keypair_value].present?
          ec2key = Ec2PrivateKey.create!(
            name:  infra_params[:keypair_name],
            value: infra_params[:keypair_value]
          )
          ec2key.id
        else
          nil
        end
      infra_params.delete(:keypair_name)
      infra_params.delete(:keypair_value)

      return infra_params
    end
  end

  # resourcesを返す。
  # もしresourcesが存在しなければ、Stackから情報を取得し作成する。
  # @return [Resource::ActiveRecord_Associations_CollectionProxy]
  def resources_or_create
    return self.resources if self.resources.present?

    stack = Stack.new(self)
    self.resources = stack.get_resources

    return self.resources
  end

  # AWS の access key を返す。
  # @return [String]
  def access_key
    return @access_key if @access_key
    project = self.project
    @access_key ||= project.access_key
    @secret_access_key ||= project.secret_access_key

    return @access_key
  end

  # AWS の secret access key を返す。
  # @return [String]
  def secret_access_key
    return @secret_access_key if @secret_access_key
    project = self.project
    @access_key ||= project.access_key
    @secret_access_key ||= project.secret_access_key

    return @secret_access_key
  end

  # 登録されている keypair の名前を返す。
  # keypair を持っていなければ nil を返す。
  # @return [String, NilClass]
  def keypairname
    if self.ec2_private_key_id
      self.ec2_private_key.name
    else
      nil
    end
  end

  # Chef から登録を削除する。
  def detach_chef
    Stack.new(self).detach_chef
  end

  def detach_zabbix
    s = ZabbixServer.find(self.project.zabbix_server_id)
    begin
      z = Zabbix.new(s.fqdn, s.username, s.password)
      z.delete_hosts_by_infra(self)
    rescue => ex
      return self if ex.message.include?("No host ID given.") # In many cases, not before register zabbix
      raise ex
    end
    self
  end


  # @return [Aws::EC2::Client]
  def ec2
    ::Aws::EC2::Client.new(
      access_key_id:     self.access_key,
      secret_access_key: self.secret_access_key,
      region:            self.region
    )
  end

  # @params [String] physical_id
  # @return [EC2Instance]
  def instance(physical_id)
    EC2Instance.new(self, physical_id: physical_id)
  end

  # @params [String] physical_id
  # @return [RDS]
  def rds(physical_id)
    RDS.new(self, physical_id)
  end

  # @return [TrueClass|FalseClass]
  def create_complete?
    return self.status == 'CREATE_COMPLETE'
  end

  def resource(physical_id)
    resources.find_by(physical_id: physical_id)
  end
end
