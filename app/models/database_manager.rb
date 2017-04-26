#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DatabaseManager
  SQLPATH = 'tmp/import.sql'.freeze
  SECRETS = [:secret_key_base, :db_crypt_key].freeze
  SUFFIX = {
    'development' => 'dev',
    'test'        => 'test',
    'production'  => 'prod',
  }.freeze

  class << self
    def export_as_zip
      dbname   = ActiveRecord::Base.configurations[Rails.env]['database']
      filename = "#{dbname}.sql"
      path     = Rails.root.join("tmp/#{filename}")

      system('rake db:data:dump')

      zipfile = Tempfile.open("skyhopper")
      ::Zip::File.open(zipfile.path, ::Zip::File::CREATE) do |zip|
        zip.add(filename, path)

        Rails.application.secrets.each do |key, value|
          next if value.nil?
          zip.get_output_stream(key) { |io| io.write(value) }
        end
      end

      FileUtils.rm(path)

      zipfile
    end

    def import(sqlpath, secrets)
      env = SUFFIX[Rails.env]
      secrets.each do |key, value|
        path = Rails.root.join('secrets', "#{key}-#{env}")
        File.write(path, value)
      end

      ReloadSecretsJob.perform_now   # runs in Rails process
      ReloadSecretsJob.perform_later # runs in Sidekiq process

      system("rake db:data:load[#{sqlpath}]")
      Rails.cache.clear
    end


    def import_from_zip(path)
      zip = ::Zip::File.open(path)
      validate_zip!(zip)

      FileUtils.rm(SQLPATH) if File.exist?(SQLPATH)
      zip.glob('*.sql').first.extract(SQLPATH)
      secrets = SECRETS.map { |name| [name, zip.read(name)] }.to_h
      zip.close

      import(SQLPATH, secrets)
    end

    def validate_zip_file!(path)
      zip = ::Zip::File.open(path)
      validate_zip!(zip)
    end

    private
    def validate_zip!(zip)
      SECRETS.each do |filename|
        raise "#{filename} is not found in zip." unless zip.find_entry(filename)
      end
      raise 'SQL file is not found in zip.' if zip.glob('*.sql').empty?
    end
  end
end
