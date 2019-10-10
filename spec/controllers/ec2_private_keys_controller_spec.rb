#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Ec2PrivateKeysController do
  login_user

  describe '#create' do
    let(:project) { create(:project) }
    let(:region) { 'us-east-1' }
    let(:name) { 'foobar' }
    let(:key) { { 'hoge' => 'fuga' } }
    let(:req) { post :create, params: { project_id: project.id, region: region, name: name } }

    context 'when success' do
      before do
        expect(Ec2PrivateKey).to receive(:new_from_aws).with(name, project.id.to_s, region).and_return(key)
        req
      end

      should_be_success

      it 'should render json' do
        expect(response.body).to eq JSON.generate(key)
      end
    end

    context 'when failure' do
      let(:err_msg) { 'This is error!!!' }
      before do
        expect(Ec2PrivateKey).to receive(:new_from_aws).with(name, project.id.to_s, region).and_raise(err_msg)
        req
      end

      should_be_failure

      it 'should render error message' do
        expect(response.body).to eq err_msg
      end
    end
  end
end
