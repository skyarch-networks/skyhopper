require_relative '../spec_helper'

describe ResourcesController do
  let(:infra){create(:infrastructure)}
  let(:resources){create_list(:resource, 3, infrastructure: infra)}
  before{resources}

  describe '#index' do
    before{get :index, infra_id: infra.id}

    should_be_success

    it 'should render JSON' do
      JSON.parse(response.body)
    end
  end

  describe '#create' do
    let(:physical_id){'i-hogehoge'}
    let(:screen_name){'hogefuga'}
    let(:req){post :create, infra_id: infra.id, physical_id: physical_id, screen_name: screen_name}

    before{req}

    should_be_success

    it 'should increment resource' do
      expect(infra.resources.size).to eq resources.size + 1
    end

    it 'should set physical_id' do
      expect(infra.resources.last.physical_id).to eq physical_id
    end

    it 'should set screen_name' do
      expect(infra.resources.last.screen_name).to eq screen_name
    end
  end
end
