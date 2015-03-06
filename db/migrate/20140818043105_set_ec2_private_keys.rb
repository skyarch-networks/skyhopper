class SetEc2PrivateKeys < ActiveRecord::Migration
  def change
    return nil if AppSetting.count == 0

    key_dir = AppSetting.first.sshkey_directory
    infras = Infrastructure.all
    infras.each do |infra|
      p = Ec2PrivateKey.new(
        name:  infra[:keypairname],
        value: File.read( File.join(key_dir, infra.id.to_s) )
      )
      p.save!
      infra.ec2_private_key_id = p.id
      infra.save!
    end

    app_settings = AppSetting.all
    app_settings.each do |app_setting|
      p = Ec2PrivateKey.new(
        name:  File.basename(app_setting.aws_keypair, '.*'),
        value: File.read(app_setting.aws_keypair)
      )
      p.save!
      app_setting.ec2_private_key_id = p.id
      app_setting.save!
    end
  end
end
