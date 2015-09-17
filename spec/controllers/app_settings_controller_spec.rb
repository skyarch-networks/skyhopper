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

    before do
      allow(Thread).to receive(:new_with_db)
      allow_any_instance_of(AppSettingsController).to receive(:check_eip_limit!)
    end

    context 'when valid settings' do
      before do
        create(:client, code: Client::ForSystemCodeName)
      end
      before do
        allow_any_instance_of(Ec2PrivateKey).to receive(:id).and_return(ec2key.id)
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
        settings_with_ec2_key_id[:log_directory] = 'hogehoge'
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

  describe '#check_eip_limit!' do
    controller AppSettingsController do
      def authorize(*)end #XXX: pundit hack
      def test
        check_eip_limit!('ap-northeast-1', 'ACCESS_KEY', 'SECRET')
        render text: 'success'
      rescue ::AppSettingsController::EIPLimitError => ex
        render text: 'failure', status: 400
      end
    end
    before{routes.draw{resources(:app_settings){collection{get :test}}}}
    let(:req){get :test}

    let(:eip_n){2}

    before do
      res = double('describe_account_attributes response')
      allow(res).to receive_message_chain(:account_attributes, :find, :attribute_values, :first, :attribute_value).and_return('5')
      allow_any_instance_of(Aws::EC2::Client).to receive(:describe_account_attributes).and_return(res)
      allow_any_instance_of(Aws::EC2::Client).to receive_message_chain(:describe_addresses, :addresses).and_return(Array.new(eip_n))
      req
    end

    context 'when can allocate EIP' do
      let(:eip_n){2}
      should_be_success

      it 'should be set body' do
        expect(response.body).to eq 'success'
      end
    end

    context 'when cannot allocate EIP' do
      let(:eip_n){4}
      should_be_failure

      it 'should be set body' do
        expect(response.body).to eq 'failure'
      end
    end
  end
end
