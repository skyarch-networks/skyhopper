#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module MonitoringsHelper
  @@url_settings = [
    {name: "Scenario Name",   example: "zabbix webcheck",       sym: :scenario_name}, 
    {name: "Step Name",       example: "Home, Home/About",      sym: :step_name},
    {name: "URL",             example: "http://www.zabbix.com", sym: :url},
    {name: "Required String", example: "welcome",               sym: :required_string},
    {name: "Status Code",     example: "200, 201, 202",         sym: :status_code},
    {name: "Timeout",         example: "15, 60 (sec)",          sym: :timeout}
  ]

  def url_settings
    @@url_settings
  end
end
