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
    before do
      get :show
    end

    should_be_success
  end

  describe '#create' do
    let(:settings){{
      aws_region: 'ap-northeast-1',
      log_directory: '/foo'
    }}

    context 'when valid settings' do
      let(:ec2key){create(:ec2_private_key)}
      let(:settings_with_ec2_key_id){settings.merge(keypair_name: ec2key.name, keypair_value: ec2key.value)}

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

    context 'when invalid settings' do
      before do
        allow(AppSetting).to receive(:validate).and_raise(AppSetting::ValidateError)
      end

      it 'should not be success' do
        post :create, settings: settings.to_json
        expect(response).not_to be_success
      end
    end
  end

  describe '#chef_create' do
    skip
    # let(:stack_name){'foo'}
    # let(:region){'REGION_FOOO'}
    # let(:keypair_name){'KEYPAIR_NAME_FOO'}
    # let(:keypair_value){'KEYPAIR_VALUE_FOO'}
    #
    #
    # it 'should call ChefServer.create' do
    #   expect(ChefServer).to receive(:create).with(stack_name, region, keypair_name, keypair_value)
    #
    #   post :chef_create, stack_name: stack_name, region: region, keypair_name: keypair_name, keypair_value: keypair_value
    # end
  end
end
