#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe AppSettingsController, :type => :controller do
  login_user

  before do
    AppSetting.delete_all
  end

  describe '#show' do
    let(:req){get :show}

    context 'when success' do
      before{req}
      should_be_success
    end

    context 'when AppSetting already set' do
      before{create(:app_setting)}
      before{req}
      it {is_expected.to redirect_to root_path}
    end
  end

  describe '#create' do
    let(:settings){{
      aws_region: 'ap-northeast-1',
      log_directory: '/foo'
    }}
    let(:ec2key){create(:ec2_private_key)}
    let(:settings_with_ec2_key_id){settings.merge(keypair_name: ec2key.name, keypair_value: ec2key.value)}

    context 'when valid settings' do

      before do
        allow(Thread).to receive(:new_with_db)
      end

      before do
        allow_any_instance_of(Ec2PrivateKey).to receive(:id).and_return(ec2key.id)
      end

      before do
        expect(AppSetting).to receive(:validate).with(settings.merge(ec2_private_key_id: ec2key.id))
      end

      it 'should create AppSetting' do
        expect(AppSetting).to receive(:clear_cache).with(no_args)
        expect(AppSetting).to receive(:clear_dummy).with(no_args)
        post :create, settings: settings_with_ec2_key_id.to_json

        expect(response).to be_success
      end
    end

    context 'when without ec2 key' do
      before do
        post :create, settings: settings.to_json
      end

      should_be_failure
    end

    context 'when invalid setting' do
      before do
        allow(AppSetting).to receive(:validate).and_raise(AppSetting::ValidateError)
        post :create, settings: settings_with_ec2_key_id.to_json
      end

      should_be_failure
    end
  end

  describe '#edit_zabbix' do
    let(:set){create(:app_setting)}
    before{set}
    before{get :edit_zabbix}

    should_be_success
    it {is_expected.to render_template 'zabbix_server'}
    it 'should assign @app_setting' do
      expect(assigns[:app_setting]).to eq set
    end
  end

  describe '#update_zabbix' do
    let(:set){create(:app_setting)}
    before{set}
    let(:zabbix_user){SecureRandom.hex(20)}
    let(:zabbix_pass){SecureRandom.hex(20)}
    let(:req){post :update_zabbix, zabbix_user: zabbix_user, zabbix_pass: zabbix_pass}

    context 'when success' do
      before{req}

      it {is_expected.to redirect_to clients_path}

      it 'should update AppSetting' do
        expect(AppSetting.get.zabbix_user).to eq zabbix_user
        expect(AppSetting.get.zabbix_pass).to eq zabbix_pass
      end
    end

    context 'when failure' do
      before do
        allow_any_instance_of(AppSetting).to receive(:update!).and_raise
        req
      end

      should_be_failure

      it 'should not update AppSetting' do
        AppSetting.clear_cache
        expect(AppSetting.get.zabbix_user).not_to eq zabbix_user
        expect(AppSetting.get.zabbix_pass).not_to eq zabbix_pass
      end
    end
  end
end
