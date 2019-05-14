#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class Users::SessionsController < Devise::SessionsController
  prepend_before_action :check_mfa_key, only: :create

  def check_mfa_key
    user = User.find_by(email: params[:user][:email])

    unless user # User not found
      flash[:alert] = I18n.t('devise.failure.not_found_in_database')
      redirect_to new_user_session_path
      return
    end

    unless user.mfa_secret_key # Not use MFA
      return
    end

    unless params[:user][:mfa_token] # Receive (email && password) only
      unless user.valid_password?(params[:user][:password])
        flash[:alert] = I18n.t('devise.failure.invalid')
        redirect_to new_user_session_path
        return
      end

      @user = User.new(email: user.email)
      @password = params[:user][:password]
      render action: :mfa
      return
    end

    # Receive email, password and MFA-token
    token = params[:user][:mfa_token]
    totp = ROTP::TOTP.new(user.mfa_secret_key)
    return if totp.verify(token)

    flash[:alert] = I18n.t('users.msg.mfa_failure')
    redirect_to new_user_session_path
    nil
  end
end
