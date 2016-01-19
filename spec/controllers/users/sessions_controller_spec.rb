#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../../spec_helper.rb'

describe Users::SessionsController do
  describe '#check_mfa_key' do
    let(:user){create(:user, mfa_secret_key: ROTP::Base32.random_base32)}
    let(:email){user.email}
    let(:password){user.password}
    let(:mfa_token){nil}
    let(:req){post :create, user: {email: email, password: password, mfa_token: mfa_token}}

    before do
      @request.env["devise.mapping"] = Devise.mappings[:user]
    end

    # Mock
    controller Users::SessionsController do
      def create
        render text: 'success create'
      end
    end

    context 'when user not found' do
      let(:email){"#{SecureRandom.hex(20)}@example.com"}
      before{req}

      it {is_expected.to redirect_to new_user_session_path}

      it 'should set alert' do
        expect(request.flash[:alert]).to eq I18n.t('devise.failure.not_found_in_database')
      end
    end

    context 'when user has not mfa key' do
      before do
        user.mfa_secret_key = nil
        user.save!
        req
      end

      should_be_success
      it 'should do action create' do
        expect(response.body).to eq 'success create'
      end
    end

    context 'when not receive MFA token' do
      context 'when password is invalid' do
        let(:password){SecureRandom.hex(20)}
        before{req}

        it {is_expected.to redirect_to new_user_session_path}

        it 'should set alert' do
          expect(request.flash[:alert]).to eq I18n.t('devise.failure.invalid')
        end
      end

      context 'when password is valid' do
        before{req}

        should_be_success

        it 'should assign @user' do
          expect(assigns[:user]).to be_a User
          expect(assigns[:user].email).to eq email
        end

        it 'should assign @password' do
          expect(assigns[:password]).to eq password
        end

        it {is_expected.to render_template :mfa}
      end
    end

    context 'when receive email, password and MFA-token' do
      context 'when verify success' do
        let(:mfa_token){ROTP::TOTP.new(user.mfa_secret_key).now}
        before{req}

        should_be_success
        it 'should do action create' do
          expect(response.body).to eq 'success create'
        end
      end

      context 'when verify failure' do
        let(:mfa_token){rand(1000000).to_s}
        before{req}

        it {is_expected.to redirect_to new_user_session_path}
        it 'should set alert' do
          expect(request.flash[:alert]).to eq I18n.t('users.msg.mfa_failure')
        end
      end
    end
  end
end
