class CryptizeApiKeyOfProjectAndAppSetting < ActiveRecord::Migration
  def change
    Project.all.each do |x|
      k = x.read_attribute(:access_key)
      s = x.read_attribute(:secret_access_key)
      x.access_key = k
      x.secret_access_key = s
      x.save!
    end

    AppSetting.all.each do |x|
      p = x.read_attribute(:zabbix_pass)
      x.zabbix_pass = p
      x.save!
    end
    AppSetting.clear_cache
  end
end
