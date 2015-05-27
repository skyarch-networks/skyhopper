require_relative '../spec_helper'

describe KeyPairsController do
  login_user

  let(:project){create(:project)}

  describe '#index' do
    before{get :index, project_id: project.id}

    should_be_success

    it 'should assign @allow_change' do
      expect(assigns[:allow_change]).to be true
    end
  end

  describe '#retrieve' do
    let(:keypairs){double(:keypairs)}
    before do
      expect(KeyPair).to receive(:all).and_return(keypairs)
      get :retrieve, project_id: project.id
    end

    should_be_success

    it 'should assign @regions' do
      expect(assigns[:regions]).to eq AWS::Regions
    end

    it 'should assign @key_pairs' do
      expect(assigns[:key_pairs]).to eq keypairs
    end
  end

  describe '#destroy' do
    let(:region){AWS::Regions.sample}
    let(:key_name){SecureRandom.hex(10)}

    before do
      expect_any_instance_of(Aws::EC2::Client).to receive(:delete_key_pair).with(key_name: key_name)
      delete :destroy, region: region, name: key_name, project_id: project.id
    end

    should_be_success
  end
end
