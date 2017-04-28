#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module MaintenanceMode
  module_function

  def activate(settings = nil)
    maint_file = Turnout::MaintenanceFile.default
    maint_file.import(settings.stringify_keys) if settings.is_a?(Hash)
    maint_file.write
    Rails.logger.info("Maintenance mode has activated.\nReason: \"#{maint_file.reason}\"")
  end

  def deactivate
    Turnout::MaintenanceFile.default.delete
    Rails.logger.info('Maintenance mode has deactivated.')
  end

end
