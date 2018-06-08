#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe InfrastructuresController, type: :controller do
  login_user

  let(:infra){create(:infrastructure)}
  let(:project){infra.project}
  let(:infra_stknm){'stackname'}
  let(:infra_region){'region'}
  let(:infra_hash){ attributes_for(:infrastructure, project_id: project.id, stack_name: infra_stknm, keypair_name: infra_key_name, keypair_value: infra_key_value, region: infra_region) }
  let(:zabbix_server){create(:zabbix_server)}

  let(:regions) {AWS::Regions}
  let(:ec2_private_key_list){
    project.infrastructures.map{|infrastructure|
      [
        "#{infrastructure.stack_name}(#{infrastructure.ec2_private_key.name})",
        infrastructure.ec2_private_key.id
      ]
    }
  }

  describe '#index' do
    before { get :index, project_id: project.id }

    should_be_success

    it "assigns @selected_project" do
      expect(assigns[:selected_project]).to eq project
    end

    it "assigns @selected_client" do
      expect(assigns[:selected_client]).to eq project.client
    end

    it "assigns @infrastructures" do
      assigns[:infrastructures].each do |infrastructure|
        expect(infrastructure).to be_a(Infrastructure)
      end
    end
  end

  describe "GET #show" do
    let(:infra){create(:infrastructure)}
    let(:ec2_resource){create(:ec2_resource, infrastructure: infra)}
    let(:rds_resource){create(:rds_resource, infrastructure: infra)}
    let(:s3bucket_resource){create(:s3bucket_resource, infrastructure: infra)}
    let(:stack_status){{available: stack_availability, message: "stack_message", status: ""}}

    before do
      allow_any_instance_of(Resource).to receive(:detach_chef)
      allow_any_instance_of(Resource).to receive(:detach_zabbix)
      ec2_resource
      rds_resource
      s3bucket_resource
    end
    let(:request_show){get :show, id: infra.id}

    stubize_stack

    context "when status available false" do
      let(:stack_availability){false}

      before do
        allow_any_instance_of(Stack).to receive(:status).and_return(stack_status)
        request_show
      end

      it "should delete resources" do
        infra.reload
        expect(infra.resources).to be_empty
      end

      it "infra.status should be ''" do
        expect(assigns[:infrastructure].status).to eq ""
      end

      it "infra.status should be saved" do
        expect(assigns[:infrastructure]).to be_persisted
      end

      should_be_success
    end

    context "when status available true" do
      let(:stack_availability){true}

      before do
        allow_any_instance_of(Stack).to receive(:status).and_return(stack_status)
        allow_any_instance_of(Stack).to receive(:create_complete?).and_return(create_status)
        allow_any_instance_of(Stack).to receive(:update_complete?).and_return(update_status)
        allow_any_instance_of(Stack).to receive(:in_progress?).and_return(progress_status)
        allow_any_instance_of(Stack).to receive(:failed?).and_return(failed_status)
      end

      ["create", "update", "progress", "failed"].each do |action|
        context "when #{action}?" do
          let(:create_status){action == "create"}
          let(:update_status){action == "update"}
          let(:progress_status){action == "progress"}
          let(:failed_status){action == "failed"}

          case action
          when "create", "update"
            if action == "update"
              before do
                allow_any_instance_of(Infrastructure).to receive(:resources_or_create).and_return(infra.resources)
              end

              it "should delete resource" do
                infra.reload
                expect(infra.resources).to be_empty
              end
            end
          end

          before do
            request_show
          end

          it "should assign infra.status eq stack.status" do
            expect(assigns[:infrastructure].status).to eq stack_status[:status]
          end

          it "should be persisted" do
            expect(assigns[:infrastructure]).to be_persisted
          end

          should_be_success
        end
      end
    end
  end

  describe '#stack_events' do
    let(:events){[{foo: 'hoge'}]}
    let(:status_and_type){{foo: 'bar'}}
    let(:stack){double('stack', events: events, status_and_type: status_and_type)}
    before do
      allow(Stack).to receive(:new).and_return(stack)
      get :stack_events, id: infra.id
    end

    should_be_success

    let(:body){JSON.parse(response.body, symbolize_names: true)}

    it 'should assign stack_status' do
      expect(body[:stack_status]).to eq status_and_type
    end

    it 'should assign events' do
      expect(body[:stack_events]).to eq events
    end
  end

  describe '#new' do
    before { get :new, project_id: project.id }

    should_be_success

    it "assigns @regions" do
      expect(assigns[:regions]).to eq regions
    end

    it "assigns @infrastructure" do
      expect(assigns[:infrastructure]).to be_a(Infrastructure)
    end

    it "assigns @ec2_private_key_list" do
      expect(assigns[:ec2_private_key_list]).to eq(ec2_private_key_list)
    end
  end

  describe '#edit' do
    before do
      get :edit, id: infra.id
    end

    context 'when cant edit' do
      it 'assigns @infrastructure' do
        expect(assigns[:infrastructure]).to be_a(Infrastructure)
      end

      it 'redirect_to infra#index' do
        expect(response).to redirect_to infrastructures_path(project_id: infra.project_id)
      end
    end

    context 'when can edit' do
      let(:infra){create(:infrastructure, status: '')}

      should_be_success

      it 'assigns @infrastructure' do
        expect(assigns[:infrastructure]).to be_a(Infrastructure)
      end

      it 'assigns @regions' do
        expect(assigns[:regions]).to eq regions
      end
    end
  end

  describe 'POST #create' do
    let(:ec2_key){create(:ec2_private_key)}
    let(:infra_key_name){ec2_key.name}
    let(:infra_key_value){ec2_key.value}
    let(:params){{infrastructure: infra_hash}}
    let(:create_request){post :create, params}
    before do
      allow(KeyPair).to receive(:validate!)
    end

    context 'when create succees' do
      it 'should increase the total count of database by one' do
        project #XXX: これがないとコケる
        expect{create_request}.to change(Infrastructure, :count).by(1)
      end

      it do
        create_request
        expect(response).to redirect_to(infrastructures_path(project_id: project.id))
      end
    end

    context 'when select KeyPair and create success' do
      let(:old_ec2_private_key){infra.ec2_private_key}
      before do
        params[:infrastructure][:keypair_input_type] = 'select'
        params[:infrastructure][:copy_ec2_private_key_id] = old_ec2_private_key.id
      end

      it 'shoud copied ec2_private_key is set' do
        old_infrastructure_ids = Infrastructure.pluck(:id)
        create_request
        created_infrastructure = Infrastructure.find(Infrastructure.pluck(:id) - old_infrastructure_ids)[0]
        created_ec2_private_key = created_infrastructure.ec2_private_key
        expect(created_ec2_private_key.id).not_to eq(old_ec2_private_key.id)
        expect(created_ec2_private_key.name).to eq(old_ec2_private_key.name)
        expect(created_ec2_private_key.value).to eq(old_ec2_private_key.value)
      end
    end

    context 'when create fails' do
      before do
        allow(Infrastructure).to receive(:create_with_ec2_private_key!).and_raise(StandardError)
        create_request
      end

      should_be_failure

      it 'should have an error message' do
        expect(create_request.request.flash['alert']).to_not be_nil
      end

      it 'should assign @regions' do
        expect(assigns(:regions)).to eq regions
      end

      it "should assigns @ec2_private_key_list" do
        expect(assigns[:ec2_private_key_list]).to eq(ec2_private_key_list)
      end

      it 'should make a new infra instance' do
        expect(assigns(:infrastructure)).to be_a_new(Infrastructure)
      end
    end
  end # end of Post #create

  describe 'PATCH #update' do
    let(:params){{id: infra.id, infrastructure: attributes_for(:infrastructure)}}
    let(:req){patch :update, params}

    context 'when update success' do
      before{req}

      it {is_expected.to redirect_to infrastructures_path(project_id: infra.project_id)}
    end

    context 'when update failure' do
      before do
        params[:infrastructure][:stack_name] = '1 Invalid as CFT Stack Name'
        req
      end

      should_be_failure

      it 'should assign @regions' do
        expect(assigns[:regions]).to eq AWS::Regions
      end
    end
  end

  describe '#destroy' do
    let(:req){delete :destroy, id: infra.id}

    stubize_zabbix
    stubize_infra
    run_zabbix_server
    request_as_ajax

    context 'when delete successfully' do
      before do
        allow(ZabbixServer).to receive(:find) {zabbix_server}
        req
      end
      should_be_success

      it do
        expect(Infrastructure).not_to be_exists infra.id
      end
    end

    context 'when delete failures' do
      before do
        allow(ZabbixServer).to receive(:find) {zabbix_server}
        allow_any_instance_of(Infrastructure).to receive(:destroy!).and_raise
        req
      end

      should_be_failure

      it do
        expect(Infrastructure).to be_exists infra.id
      end
    end
  end

  describe '#delete_stack' do
    stubize_zabbix
    stubize_infra
    run_zabbix_server
    request_as_ajax

    let(:delete_stack_request){post :delete_stack, id: infra.id}

    context 'when delete stack success' do
      stubize_stack

      before do
        allow(ZabbixServer).to receive(:find) {zabbix_server}
        delete_stack_request
      end

      should_be_success
    end

    context 'when detach zabbix fail' do
      before do
        allow_any_instance_of(Infrastructure).to receive(:detach_zabbix).and_raise
        delete_stack_request
      end

      should_be_failure
    end

    context 'when delete stack fail' do
      stubize_stack(delete: :error)

      before do
        delete_stack_request
      end

      should_be_failure
    end
  end

  describe '#show_s3' do
    let(:bucket_name){"log_bucket"}
    let(:request_show_s3){ get :show_s3, id: infra.id, bucket_name: bucket_name }

    stubize_s3
    before{request_show_s3}
    subject{Infrastructure.find(infra.id)}

    should_be_success

    it 'should assign @s3' do
      # _s3 defined by support/mocks/s3.rb
      expect(assigns[:s3]).to eq _s3
    end

    it 'should assign @bucket_name' do
      expect(assigns[:bucket_name]).to eq bucket_name
    end

    it do
      expect(response).to render_template(partial: '_show_s3')
    end
  end

  describe '#show_rds' do
    let(:physical_id){SecureRandom.hex(30)}

    stubize_rds
    before do
      get :show_rds, id: infra.id, physical_id: physical_id
    end

    should_be_success
  end

  describe '#show_elb' do
    let(:physical_id){"hogefugahoge-ElasticL-1P3I4RD6PEUBK"}
    let(:req){get :show_elb, id: infra.id, physical_id: physical_id}
    let(:instances){[double('ec2A', :[] => 'hogefaaaaa')]}
    let(:dns_name){'hoge.example.com'}
    let(:listeners){['hoge']}
    let(:security_groups){[]}
    let(:elb){double('elb', instances: instances, dns_name: dns_name, listeners: listeners, list_server_certificates: [[]], security_groups: security_groups)}

    before do
      allow(ELB).to receive(:new).with(infra, physical_id).and_return(elb)
      create(:ec2_resource, infrastructure: infra)
      req
    end

    should_be_success

    it 'should assign @ec2_instances' do
      expect(assigns[:ec2_instances]).to eq instances
    end

    it 'should assign @dns_name' do
      expect(assigns[:dns_name]).to eq dns_name
    end

    it 'should assign @listeners' do
      expect(assigns[:listeners]).to eq listeners
    end

    it 'should assign @unregistereds' do
      expect(assigns[:unregistereds]).to eq infra.resources.ec2
    end

    it 'should assign @security_groups' do
      expect(assigns[:security_groups]).to eq security_groups
    end
  end

  describe '#change_rds_scale' do
    let(:type){'db.m1.small'}

    subject{
      post(
        :change_rds_scale,
        physical_id:   'hogehoge',
        id:            infra.id,
        instance_type: type
      )
    }

    before do
      allow_any_instance_of(RDS).to receive(:db_instance_class)
    end

    it 'should call RDS#change_scale' do
      expect_any_instance_of(RDS).to receive(:change_scale).with(type)
      subject
    end

    context 'when ChangeScaleError' do
      let(:ex_msg){"hoge"}

      before do
        allow_any_instance_of(RDS).to receive(:change_scale){raise RDS::ChangeScaleError, ex_msg}
        subject
      end

      it 'should render error message' do
        expect(response.body).to eq ex_msg
      end

      should_be_failure
    end
  end

  describe '#project_exist' do
    controller InfrastructuresController do
      before_action :project_exist
      def foo
        render text: 'success!!!'
      end
      def authorize(*)end #XXX: pundit hack
      def allowed_infrastructure(_);end #skip
    end
    before{routes.draw{resources(:infrastructures){collection{get :foo}}}}
    let(:prj_id){project.id}
    let(:req){get :foo, project_id: prj_id}

    context 'when project_id param is blank' do
      let(:prj_id){nil}
      before{req}
      should_be_success
    end

    context 'when project exists' do
      before{req}
      should_be_success
    end

    context 'when user is master' do
      context 'when client_id is present' do
        let(:client){build_stubbed(:client)}
        before do
          session[:client_id] = client.id
          project.delete
          req
        end
        it {is_expected.to redirect_to projects_path(client_id: client.id)}
      end

      context 'when client_id is blank' do
        before do
          project.delete
          req
        end
        it {is_expected.to redirect_to clients_path}
      end
    end

    context 'when user is not master' do
      login_user(master: false)
      before{project.delete; req}
      it {is_expected.to redirect_to projects_path}
    end
  end

  describe '#infrastructure_exist' do
    controller InfrastructuresController do
      before_action :infrastructure_exist
      def foo
        render text: 'success!!!'
      end
      def authorize(*)end #XXX: pundit hack
      def allowed_infrastructure(_);end #skip
    end
    before{routes.draw{resources(:infrastructures){collection{get :foo}}}}
    let(:infra_id){infra.id}
    let(:req){get :foo, id: infra_id}

    context 'when id param is blank' do
      let(:infra_id){nil}
      before{req}
      should_be_success
    end

    context 'when infra exists' do
      before{req}
      should_be_success
    end

    context 'when project_id is present' do
      before do
        session[:project_id] = project.id
        infra.delete
        req
      end
      it {is_expected.to redirect_to infrastructures_path(project_id: project.id)}
    end

    context 'when project id is blank' do
      context 'when user is master' do
        before{infra.delete; req}
        it {is_expected.to redirect_to clients_path}
      end

      context 'when user isnot master' do
        login_user(master: false)
        before{infra.delete; req}

        it {is_expected.to redirect_to projects_path}
      end
    end
  end

  describe '#edit_keypair' do
    before do
      get :edit_keypair, id: infra.id
    end

    let(:infra){create(:infrastructure, status: '')}

    should_be_success

    it "assigns @ec2_private_key_list" do
      expect(assigns[:ec2_private_key_list]).to eq(ec2_private_key_list)
    end
  end

  describe '#update_keypair' do
    let(:ec2_key){create(:ec2_private_key)}
    let(:infra_key_name){ec2_key.name}
    let(:infra_key_value){ec2_key.value}
    let(:params){{id: infra.id, infrastructure: infra_hash}}
    let(:req){patch :update_keypair, params}
    before do
      allow(KeyPair).to receive(:validate!)
    end

    context 'when update success' do
      before{req}

      it {is_expected.to redirect_to infrastructures_path(project_id: infra.project_id)}
    end

    context 'when select KeyPair and update success' do
      let(:old_ec2_private_key){infra.ec2_private_key}
      before do
        params[:infrastructure][:keypair_input_type] = 'select'
        params[:infrastructure][:copy_ec2_private_key_id] = old_ec2_private_key.id
        req
      end

      it 'shoud copied ec2_private_key is set' do
        infra.reload
        created_ec2_private_key = infra.ec2_private_key
        expect(created_ec2_private_key.id).not_to eq(old_ec2_private_key.id)
        expect(created_ec2_private_key.name).to eq(old_ec2_private_key.name)
        expect(created_ec2_private_key.value).to eq(old_ec2_private_key.value)
      end
    end

    context 'when update failure' do
      before do
        params[:infrastructure][:keypair_value] = 'Invalid as keypair_value'
        req
      end

      should_be_failure

      it "assigns @ec2_private_key_list" do
        expect(assigns[:ec2_private_key_list]).to eq(ec2_private_key_list)
      end
    end
  end
end
