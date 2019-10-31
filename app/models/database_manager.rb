#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DatabaseManager
  SQLPATH = 'tmp/import.sql'.freeze
  SECRETS = %i[secret_key_base db_crypt_key db_crypt_salt].freeze
  SUFFIX = {
    'development' => 'dev',
    'test' => 'test',
    'production' => 'prod',
  }.freeze

  class << self
    def export_as_zip(no_compatibility: false)
      dbname   = ActiveRecord::Base.configurations[Rails.env]['database']
      filename = "#{dbname}.sql"
      path     = Rails.root.join("tmp/#{filename}")

      if no_compatibility
        system('rails db:data:dump[,modern]')
      else
        system('rails db:data:dump[,legacy]')
      end

      zipfile = Tempfile.open('skyhopper')
      ::Zip::File.open(zipfile.path, ::Zip::File::CREATE) do |zip|
        zip.add(filename, path)

        Rails.application.secrets.select do |key, _value|
          SECRETS.include?(key)
        end.slice(*SECRETS).each do |key, value|
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

      system("rails db:data:load[#{sqlpath}]")
      Rails.cache.clear
    end

    def import_from_zip(path)
      secrets = nil

      ::Zip::File.open(path) do |zipfile|
        validate_zip!(zipfile)

        FileUtils.rm(SQLPATH) if File.exist?(SQLPATH)
        zipfile.glob('*.sql').first.extract(SQLPATH)
        secrets = SECRETS.map { |name| [name, zipfile.read(name)] }.to_h
      end

      import(SQLPATH, secrets)
    end

    def validate_zip_file!(path)
      ::Zip::File.open(path) do |zipfile|
        validate_zip!(zipfile)
      end
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
