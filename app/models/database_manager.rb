#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DatabaseManager
  SQLPATH = 'tmp/import.sql'
  SECRETS = [:secret_key_base, :db_crypt_key]
  SUFFIX = {
    'development' => 'dev',
    'test'        => 'test',
    'production'  => 'prod',
  }

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

  end
end
