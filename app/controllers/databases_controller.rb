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
    time = Time.now.strftime('%Y%m%d%H%M%S')
    zipfile = DatabaseManager.export_as_zip
    send_file(zipfile.path, filename: "SkyHopper-db-#{Rails.env}-#{time}.zip")
    zipfile.close
  end

  # POST /databases/import
  def import
    file = params.require(:file)

    MaintenanceMode.activate

    Thread.new do
      DatabaseManager.import_from_zip(file.path)
      file.close
      MaintenanceMode.deactivate
    end

    redirect_to databases_path
  end

end
