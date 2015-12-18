#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class RootController < ApplicationController
  def root
    if AppSetting.set?
      authenticate_user!

      params[:action] = :index

      params[:controller] =
        if current_user.master?
          :clients
        else
          :projects
        end

      redirect_to params.to_hash.merge(only_path: true) and return
    else
      redirect_to app_settings_path and return
    end
  end
end
