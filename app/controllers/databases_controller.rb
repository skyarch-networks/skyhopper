#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class DatabasesController < ApplicationController
  skip_before_action :appsetting_set?

  before_action if: :app_setting_is_set do
    authenticate_user!

    man = DatabaseManager.new
    def man.policy_class
      DatabasePolicy
    end
    authorize man
  end

  helper_method :app_setting_is_set

  # POST /databases/export
  def export
    authenticate_user!

    time = Time.zone.now.strftime('%Y%m%d%H%M%S')
    zipfile = DatabaseManager.export_as_zip
    send_file(zipfile.path, filename: "SkyHopper-db-#{Rails.env}-#{time}.zip")
    zipfile.close
  end

  # POST /databases/import
  def import
    file = params.require(:file)

    DatabaseManager.validate_zip_file!(file.path)

    reason = I18n.available_locales.map do |locale|
      I18n.t('databases.msg.under_maintenance', locale: locale)
    end.join
    MaintenanceMode.activate(reason: reason)

    Thread.new do
      import_zip(file)
    end

    redirect_to root_path
  end

  private

  def app_setting_is_set
    @app_setting_is_set ||= AppSetting.set?
  end

  def import_zip(file)
    DatabaseManager.import_from_zip(file.path)
  rescue StandardError => ex
    Rails.cache.write(:err, "#{ex.inspect}\n#{ex.backtrace.join}")
  ensure
    file.close
    MaintenanceMode.deactivate
  end
end
