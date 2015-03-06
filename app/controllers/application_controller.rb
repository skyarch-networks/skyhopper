#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  before_action :restore_locale
  before_action :set_notifications

  def default_url_options(option={})
    {lang: I18n.locale}
  end

  private

  def restore_locale
    lang = params[:lang]

    unless lang
      I18n.locale = nil
      return
    end


    if I18n::available_locales.include?(lang.to_sym)
      I18n.locale = lang
    else
      I18n.locale = nil
    end
  end

  def set_notifications
    @notifications_for_layout = InfrastructureLog.where(user: current_user).limit(10).order('created_at DESC')
  end
end
