#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module Node::Attribute
  Key = 'normal'


  # セットされている attribute を手に入れる。
  # @example
  #   node.get_attributes # => {:'yum_releasever/releasever' => 'latest', ...}
  # @return [Hash{Symbol => String}]
  def get_attributes
    keys = available_attributes.keys.map{|key| key.to_s.split('/')}
    result = {}
    keys.each do |key|
      d = self.details[Key]
      val = key.inject(d) do |res, word|
        begin
          res.fetch(word)
        rescue
          nil
        end
      end

      result[key.join('/').to_sym] = val
    end

    return result
  end


  # attributes をアップデートする。
  # @param [Hash] attrs
  def update_attributes(attrs)
    # TODO: 一度設定した attribute を多分消せない
    n = ChefAPI.find(:node, @name)
    n.normal.deep_merge!(attrs)
    n.save
  end

  # 現在設定できる attributes を返す
  # @return [Hash{Symbol => Any}]
  def enabled_attributes
    available_attributes.select do |_name, a|
      have_recipes?(a[:recipes]) or have_roles?(a[:recipes])
    end
  end

  # 必須の attribute がセットされているかどうかを返す。
  # @return [Boolean]
  def attribute_set?
    a = get_attributes
    return enabled_attributes.select{|_, v|v[:required]}.keys.none? do |key|
      a[key].nil?
    end
  end

  # すべての設定可能な attributes を返す
  # @return [Hash{Symbol => Any}]
  def available_attributes
    return {
      'yum_releasever/releasever': {
        type:        String,
        recipes:     ['recipe[yum_releasever]', 'recipe[yum_releasever::default]'],
        description: 'Yum release version. ex) latest, 2014.09, ...',
        # allowed_values: ['latest', '2014.09', '2014.03', '2013.09'],
      },
      'gateone/url': {
        type:        String,
        recipes:     ['role[hyclops]'],
        description: 'Zabbix Server IP. ex) https://54.172.247.142'
      },
      'zabbix/agent/servers': {
        type:        Array,
        recipes:     ['role[zabbix_agent]'],
        description: 'Zabbix FQDN ex)   ec2-54-165-199-182.compute-1.amazonaws.com',
        default:     AppSetting.get.zabbix_fqdn,
        required:    true,
      },
      'zabbix/agent/servers_active': {
        type:        Array,
        recipes:     ['role[zabbix_agent]'],
        description: 'Zabbix FQDN ex)   ec2-54-165-199-182.compute-1.amazonaws.com',
        default:     AppSetting.get.zabbix_fqdn,
        required:    true,
      },
      'zabbix/database/install_method': {
        type: String,
        recipes: ['role[zabbix_server]'],
        description: 'mysql or rds_mysql',
      },
      'zabbix/database/rds_master_username': {
        type: String,
        recipes: ['role[zabbix_server]'],
        description: 'RDSInstanceMasterUsername',
      },
      'zabbix/database/rds_master_password': {
        type: String,
        recipes: ['role[zabbix_server]'],
        description: 'RDSInstancePassword',
      },
      'zabbix/database/dbhost': {
        type: String,
        recipes: ['role[zabbix_server]'],
        description: 'RDS FQDN',
      },
      'zabbix/database/dbport': {
        type: String,
        recipes: ['role[zabbix_server]'],
        description: 'Default is 3306',
      },
      'zabbix/database/dbuser': {
        type: String,
        recipes: ['role[zabbix_server]'],
        description: 'RDSInstanceMasterUsername',
      },
      'zabbix/database/dbpassword': {
        type: String,
        recipes: ['role[zabbix_server]'],
        description: 'RDSInstancePassword',
      },
      'zabbix/agent/monitoring_rds': {
        type: :Boolean,
        recipes: ['recipe[zabbix::agent_monitoring_mysql]'],
        description: 'If this flag true, Zabbix agent monitors RDS.'
      },
      'zabbix/agent/mysql_username': {
        type: String,
        recipes: ['recipe[zabbix::agent_monitoring_mysql]'],
        description: 'MySQL username to be monitored by Zabbix Agent'
      },
      'mysql/server_root_password': {
        type: String,
        recipes: ['recipe[mysql::client]', 'recipe[mysql::server]'],
        description: 'MySQL password'
      },
    }
  end

  # @example
  #   node.attr_slash_to_hash({'yum_releasever/releasever' => '2014.09', 'zabbix/agent/servers' => 'example.com'})
  #   # {
  #   #   'yum_releasever' => {
  #   #     'releasever' => '2014.09'
  #   #   },
  #   #   'zabbix' => {
  #   #     'agent' => {
  #   #       'servers' => ['example.com']
  #   #     }
  #   #   }
  #   # }
  # @param [Hash{String => String}] slash
  #   key is a slash separated attribute name.
  #   value is an attribute value.
  # @return [Hash{String => Any}]
  def attr_slash_to_hash(slash)
    result = Hash.new
    slash.each do |key, val|
      # key is "zabbix/agent/servers"
      # val is "example.com"

      keys = key.split('/') # ['zabbix', 'agent', 'servers']

      attr = Hash.new
      keys.inject(attr) do |attr_, key_|
        if key_ != keys.last
          next attr_[key_] = {}
        end

        attr_[key_] =
          if self.available_attributes[key.to_sym][:type] == Array
            [val]
          else
            val
          end
      end

      result.deep_merge!(attr)
    end

    return result
  end
end
