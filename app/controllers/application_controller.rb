#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  before_action :appsetting_set?, unless: :appsetting_controller
  before_action :restore_locale
  before_action :set_notifications
  before_action :configure_permitted_parameters, if: :devise_controller?

  include Concerns::ErrorHandler
  include Concerns::ControllerUtil
  include Pundit

  def default_url_options(_option = {})
    { lang: I18n.locale }
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[password password_confirmation admin master])
  end

  private

  def restore_locale
    lang = params[:lang]

    unless lang
      I18n.locale = nil
      return
    end

    I18n.locale =
      if I18n::available_locales.include?(lang.to_sym)
        lang
      end
  end

  def set_notifications
    @notifications_for_layout = InfrastructureLog.where(user: current_user).limit(10).order('created_at DESC')
  end

  def with_zabbix
    z = ServerState.new('zabbix')
    z.should_be_running!(I18n.t('monitoring.msg.not_running'))
  end

  def appsetting_set?
    return if AppSetting.set?

    redirect_to app_settings_path
  end

  def appsetting_controller
    controller_name == 'app_settings'
  end
end
