#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'spec_helper'

describe DishesController, type: :controller do
  login_user

  let(:klass) { Dish }
  let(:dish) { create(:dish) }
  let(:project) { nil }

  describe '#index' do
    before do
      get :index, project_id: project.try(:id)
    end

    it 'should assign @dishes' do
      dishes = Dish.where(project_id: nil).page(1)
      expect(assigns[:dishes]).to eq dishes
    end

    context 'when have project' do
      let(:project) { create(:project) }
      before do
        create(:dish, project: project)
      end

      it 'should assign @project_id' do
        expect(assigns[:project_id]).to eq project.id.to_s
      end

      it 'should assign @project_name' do
        expect(assigns[:project_name]).to eq project.name
      end
    end

    context 'when not have project' do
      before do
        create(:dish, project: nil)
      end

      it 'should not assigns @project_id' do
        expect(assigns[:project_id]).to be_nil
      end

      it 'should not assigns @project_name' do
        expect(assigns[:project_name]).to be_nil
      end
    end
  end

  describe '#show' do
    before do
      get :show, id: dish.id
    end

    it 'should assign @dish' do
      expect(assigns[:dish]).to eq dish
    end

    it 'should assigns @selected_serverspecs' do
      expect(assigns[:selected_serverspecs]).to eq dish.servertests
    end
  end

  describe '#edit' do
    before do
      get :edit, id: dish.id
    end

    it 'should assign @global_serverspecs' do
      expect(assigns[:global_serverspecs]).to eq Servertest.global
    end

    it 'should assign @selected_serverspecs' do
      expect(assigns[:selected_serverspecs]).to eq dish.servertests
    end

    it do
      expect(response).to render_template '_edit'
    end
  end

  describe '#update' do
    let(:servertest) { create(:servertest) }
    let(:update_request) { patch :update, id: dish.id, serverspecs: [servertest.id] }

    context 'when valid params' do
      before do
        update_request
      end

      before do
        dish.reload
      end

      subject { dish }

      it 'should success' do
        expect(response).to be_success
      end

      it 'servertest should be equaled' do
        expect(subject.servertests).to eq [servertest]
      end

      it 'status should be nil' do
        expect(subject.status).to be_nil
      end
    end
  end

  describe '#new' do
    let(:project) { nil }
    before do
      get :new, project_id: project.try(:id)
    end

    context 'when have project' do
      let(:project) { create(:project) }

      it 'should assign @dish' do
        expect(assigns[:dish]).to be_a_new klass
        expect(assigns[:dish].project).to eq project
      end
    end

    context 'when not have project' do
      it 'should assign @dish' do
        expect(assigns[:dish]).to be_a_new klass
        expect(assigns[:dish].project).to be_nil
      end
    end
  end

  describe '#create' do
    let(:project) { create(:project) }
    let(:project_id) { project.id }
    let(:dish_hash) { attributes_for(:dish, name: 'name', detail: 'detail', project_id: project_id) }

    let(:create_request) { post :create, dish: dish_hash }

    context 'when valid pamrams' do
      it 'should increase the count of db by 1' do
        expect { create_request }.to change(Dish, :count).by(1)
      end

      context 'when project_id false' do
        it 'should render to dishes_path' do
          create_request
          expect(response).to redirect_to(dishes_path(project_id: project.id))
        end
      end

      context 'when project_id false' do
        let(:project_id) { nil }

        it 'should redirect without project_id' do
          create_request
          expect(response).to redirect_to(dishes_path)
        end
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(Dish).to receive(:save).and_return(false)
        create_request
      end

      context 'when project_id true' do
        it 'should render template new' do
          expect(response).to redirect_to(new_dish_path(project_id: project.id))
        end
      end

      context 'when project_id false' do
        let(:project_id) { nil }

        it 'should render template without project_id' do
          create_request
          expect(response).to redirect_to(new_dish_path)
        end
      end
    end
  end

  describe '#destroy' do
    before do
      delete :destroy, id: dish.id
    end

    it 'record should not exist' do
      expect(Dish).not_to be_exists(id: dish.id)
    end
  end
end
