require_relative '../../spec_helper'

describe Concerns::BeforeAuth do
  describe '#admin' do
    controller do
      include Concerns::BeforeAuth
      before_action :admin
      def index
        render text: 'success!!!!!'
      end
    end
    let(:req){get :index}

    context 'when login admin' do
      login_user(admin: true)
      before{req}

      should_be_success
    end

    context 'when login not admin' do
      login_user(admin: false)
      before{req}

      it {is_expected.to redirect_to root_path}
    end
  end

  describe '#master' do
    controller do
      include Concerns::BeforeAuth
      before_action :master
      def index
        render text: 'success!!!!!'
      end
    end
    let(:req){get :index}

    context 'when login master' do
      login_user(master: true)
      before{req}

      should_be_success
    end

    context 'when login not master' do
      login_user(master: false)
      before{req}

      it {is_expected.to redirect_to root_path}
    end
  end

  describe '#allowed_project' do
    controller do
      include Concerns::BeforeAuth
      before_action do
        allowed_project(params.require(:project_id))
      end
      def index
        render text: 'success!!!!!!!!!!!!'
      end
    end
    let(:req){get :index, project_id: project.id}

    context 'when login master' do
      login_user(master: true)
      let(:project){build_stubbed(:project)}
      before{req}

      should_be_success
    end

    context 'when login not master' do
      login_user(master: false)
      let(:user){User.find session['warden.user.user.key'][0]}

      context 'when allowed' do
        let(:project){create(:project, users: user)}
        before{req}

        should_be_success
      end

      context 'when not allowed' do
        let(:project){create(:project)}
        before{req}

        it {is_expected.to redirect_to projects_path(client_id: project.client_id)}
      end
    end
  end

  context '#allowed_infrastructure' do
    controller do
      include Concerns::BeforeAuth
      before_action do
        allowed_infrastructure(params.require(:infra_id))
      end
      def index
        render text: 'success!!!!!!!!!'
      end
    end
    let(:req){get :index, infra_id: infra.id}

    context 'when login master' do
      login_user(master: true)
      let(:infra){build_stubbed(:infrastructure)}
      before{req}

      should_be_success
    end

    context 'when login not master' do
      login_user(master: false)
      let(:user){User.find session['warden.user.user.key'][0]}

      context 'when allowed' do
        let(:project){create(:project, users: user)}
        let(:infra){create(:infrastructure, project: project)}
        before{req}

        should_be_success
      end

      context 'when not allowed' do
        let(:infra){create(:infrastructure)}
        before{req}

        it {is_expected.to redirect_to infrastructures_path(project_id: infra.project.id)}
      end
    end
  end
end
