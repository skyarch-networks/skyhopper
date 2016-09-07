#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DatabasesController < ApplicationController
  before_action do
    authenticate_user! if AppSetting.set?
  end

  # POST /databases/export
  def export
    prepare_db_zip
    send_file(@zipfile.path, filename: "SkyHopper-db-#{Rails.env}.zip")
    @zipfile.close
  end


  private
  def prepare_db_zip
    dbname   = ActiveRecord::Base.configurations[Rails.env]['database']
    filename = "#{dbname}.sql"
    path     = Rails.root.join("tmp/#{filename}")

    system('rake db:data:dump')

    @zipfile = Tempfile.open("skyhopper")
    ::Zip::File.open(@zipfile.path, ::Zip::File::CREATE) do |zip|
      zip.add(filename, path)

      SkyHopper::Application.secrets.each do |key, value|
        next if value.nil?
        zip.get_output_stream(key) { |io| io.write(value) }
      end
    end

    FileUtils.rm(path)
  end
end
