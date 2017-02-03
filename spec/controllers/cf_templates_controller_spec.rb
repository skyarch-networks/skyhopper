#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe CfTemplatesController, type: :controller do
  login_user
  let(:klass){CfTemplate}
  let(:infra){ create(:infrastructure) }
  let(:name){'name'}
  let(:detail){'detail'}
  let(:value){'{}'}
  let(:params){'params'}
  let(:cftemplate_hash) { attributes_for(:cf_template, infrastructure_id: infra.id.to_s, name: name, detail: detail, value: value, params: params) }

  describe '#index' do
    context 'format json' do
      let(:global_jsons){klass.global}

      it 'should assign @global_jsons' do
        get :index, format: 'json'
        expect(assigns[:global_jsons]).to eq global_jsons
      end
    end

    context 'format html' do
      let(:global_jsons){ klass.global.page(1) }

      it 'should assign @global_jsons' do
        get :index, format: 'html'
        expect(assigns[:global_jsons]).to eq global_jsons
      end
    end
  end

  describe '#show' do
    let(:cf_template){ create(:cf_template) }

    it 'should assign @cf_template' do
      get :show, id: cf_template.id

      expect(assigns[:cf_template]).to eq cf_template
    end

    context 'format html' do
      it do
        get :show, id: cf_template.id, format: 'html'
        expect(response).to render_template '_show'
      end
    end

    context 'format json' do
      it 'should render json' do
        get :show, id: cf_template.id, format: 'json'
        expect(response).to render_template 'show.json'
      end

      context 'when have user' do
        let(:user){ create(:user) }
        let(:cf_template_with_user){ create(:cf_template, user: user) }

        before do
          get :show, id: cf_template_with_user.id, format: 'json'
        end

        it 'should assign @operator' do
          expect(assigns[:operator][:email]).to eq user.email
          expect(assigns[:operator][:is_admin]).to eq user.admin
        end
      end

      context 'when not have user' do
        let(:cf_template_without_user){ create(:cf_template, user: nil) }

        before do
          get :show, id: cf_template_without_user.id, format: 'json'
        end

        it 'should assign @operator' do
          expect(assigns[:operator][:email]).to eq I18n.t('users.unregistered')
          expect(assigns[:operator][:is_admin]).to eq 0
        end

      end
    end
  end

  describe '#new' do
    it 'should assign @cf_template' do
      get :new
      expect(assigns[:cf_template]).to be_a_new klass
    end
  end

  describe '#new_for_creating_stack' do
    before do
      create_list(:cf_template, 5, infrastructure: infra)
      create_list(:cf_template, 5, infrastructure: nil)
    end

    before do
      get :new_for_creating_stack, infrastructure_id: infra.id
    end

    let(:resp_body){JSON.parse(response.body, symbolize_names: true)}

    it 'should return histories as JSON' do
      expect(resp_body[:histories].map{|x|x[:id]}).to eq CfTemplate.for_infra(infra.id).pluck(:id)
    end

    it 'should return globals as JSON' do
      expect(resp_body[:globals].map{|x|x[:id]}).to eq CfTemplate.global.pluck(:id)
    end
  end

  describe '#edit' do
    let(:cf_template){ create(:cf_template) }

    before do
      get :edit, id: cf_template.id
    end

    it do
      expect(response).to render_template 'edit'
    end

    it 'should assign @cf_template' do
      expect(assigns[:cf_template]).to eq cf_template
    end
  end

  describe '#insert_cf_params' do
    let(:http_params){{
      cf_template: {
        infrastructure_id: infra.id,
        name: 'foo',
        details: 'hogehoge',
        value: value,
        params: nil,
      },
      infrastructure_id: infra.id,
    }}
    let(:value){JSON[{Parameters: {}}]}
    let(:req){post :insert_cf_params, http_params}
    before do
      allow_any_instance_of(CfTemplate).to receive(:validate_template)
    end

    context 'when valid as JSON' do
      before{req}

      context 'when create EC2 instance' do
        let(:value){JSON[{Parameters: {KeyName: ''}}]}

        context 'when infra not has ec2_private_key' do
          let(:infra){ create(:infrastructure, ec2_private_key: nil) }

          should_be_failure
        end

        should_be_success
        it '@tpl should not has key "KeyName"' do
          expect(assigns[:tpl]).not_to be_has_key 'KeyName'
        end
      end

      should_be_success
      it 'should assign @tpl' do
        expect(assigns[:tpl]).to be_kind_of Hash
      end
    end

    context 'when invalid as JSON' do
      let(:value){'fooo'}
      before{req}

      should_be_failure
    end

    context 'when invalid as CloudFormation template' do
      let(:err_msg){'THIS IS ERROR!'}
      before do
        allow_any_instance_of(CfTemplate).to receive(:validate_template)
          .and_raise(Aws::CloudFormation::Errors::ValidationError.new('foo', err_msg))
        req
      end

      should_be_failure

      it 'should render error message' do
        expect(response.body).to eq err_msg
      end
    end
  end

  describe '#create' do
    let(:create_request) {post :create, cf_template: cftemplate_hash, format: format}
    let(:format){'html'}

    context "when no validtion errors" do
      let(:validate){nil}

      before do
        allow_any_instance_of(CfTemplate).to receive(:validate_template)
      end

      context 'when valid params' do
        before do
          create_request
        end

        it 'should create a new cftemplate object' do
          expect(assigns(:cf_template)).to be_a(klass)
        end

        it 'should save and send' do
          expect(assigns(:cf_template)).to be_persisted
        end

        context 'format html' do
          it 'should redirect to cf_templates' do
            expect(response).to redirect_to(cf_templates_path)
          end
        end

        context 'format json' do
          let(:format){'json'}
        end
      end

      context 'when invalid params' do
        before do
          allow_any_instance_of(klass).to receive(:save).and_return(false)
          create_request
        end

        it 'should not be saved' do
          expect(assigns(:cf_template)).not_to be_persisted
        end

        it 'should redirect to new' do
          expect(response).to render_template :new
        end
      end
    end

    context "when validation errors" do
      let(:validate){"validation error"}
      let(:error_msg){"invalid as json!"}

      before do
        allow_any_instance_of(CfTemplate).to receive(:validate_template).and_raise(StandardError, error_msg)
        create_request
      end

      it "should render new" do
        expect(response).to render_template :new
      end
    end
  end # end of describe Post

  describe '#create_and_send' do
    let(:res){{status: status, message: "message"}}
    let(:cfparams){'cfparams'}
    let(:data){cftemplate_hash.merge(cfparams: cfparams)}
    let(:create_send_request){post :create_and_send, cf_template: data}

    before do
      expect_any_instance_of(CfTemplatesController).to receive(:send_cloudformation_template).with(kind_of(CfTemplate), cfparams).and_return(res)

      create_send_request
    end

    context "when status true" do
      let(:status){"status"}
      it "should be success" do
        expect(response).to be_success
      end
    end

    context "when status false" do
      let(:status){nil}
      it 'should not be success' do
        expect(response).not_to be_success
      end
    end
  end

  describe 'PATCH #update' do
    let(:update_cftemplate){ create(:cf_template) }
    let(:update_request){patch :update, id: update_cftemplate.id, cf_template: cftemplate_hash, format: format}
    let(:format){'html'}

    context 'when valid params' do
      before do
        update_request
      end

      it 'should update finely' do
        c = klass.find(update_cftemplate.id)

        expect(c.infrastructure_id).to eq(infra.id)
        expect(c.name).to eq(name)
        expect(c.detail).to eq(detail)
        expect(c.value).to eq(value)
        expect(c.params).to eq(params)
      end

      context 'when format html' do
        it 'should redirect to show' do
          expect(response).to redirect_to(cf_templates_path)
        end
      end

      context 'when format json' do
        let(:format){'json'}
      end
    end

    context 'when invalid params' do
      before do
        allow_any_instance_of(klass).to receive(:update).and_return(false)
        update_request
      end

      context 'when format html' do
        it 'should render edit' do
          expect(response).to render_template :edit
        end
      end

      context 'when format json' do
        let(:format){'json'}
      end
    end
  end # end of describe patch #update

  describe '#destroy' do
    let(:cf_template){ create(:cf_template) }
    subject{ klass.find(cf_template.id) }

    before do
      delete :destroy, id: cf_template.id
    end

    it 'should delete cf_template' do
      expect{subject}.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe '#history' do
    before do
      get :history, infrastructure_id: infra.id
    end

    it 'should assign @histories' do
      expect(assigns[:histories]).to eq CfTemplate.for_infra(infra)
    end
  end
end
