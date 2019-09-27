#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class RootController < ApplicationController
  def root
    if AppSetting.set?
      authenticate_user!

      redirect_params = params.permit(*default_url_options.keys)
      redirect_params[:action] = :index
      redirect_params[:controller] =
        if current_user.master?
          :clients
        else
          :projects
        end

      redirect_to redirect_params and return
    else
      redirect_to app_settings_path and return
    end
  end
end
