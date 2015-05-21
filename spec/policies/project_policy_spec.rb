require_relative '../spec_helper'

describe ProjectPolicy do
  subject{described_class}
  let(:master_user){build(:user, master: true,  admin: false)}
  let(:admin_user) {build(:user, master: false, admin: true)}
  let(:normal_user){build(:user, master: false, admin: false)}
  let(:strong_user){build(:user, master: true,  admin: true)}

  let(:project){build(:project)}
  permissions :index? do
    it 'grants access any user' do
      is_expected.to permit(master_user, project)
      is_expected.to permit(admin_user,  project)
      is_expected.to permit(normal_user, project)
      is_expected.to permit(strong_user, project)
    end
  end

  %i[edit? update? destroy?].each do |action|
    permissions action do
      it 'grants access only admin user' do
        is_expected.to     permit(admin_user,  project)
        is_expected.not_to permit(master_user, project)
        is_expected.not_to permit(normal_user, project)
        is_expected.to     permit(strong_user, project)
      end
    end
  end

  permissions :destroy? do
    before do
      allow_any_instance_of(Client).to receive(:is_for_system?).and_return(true)
    end
    it 'denies access if project is system' do
      is_expected.not_to permit(strong_user, project)
    end
  end

  %i[new? create?].each do |action|
    permissions action do
      it 'grants access only admin and master user' do
        is_expected.not_to permit(admin_user,  project)
        is_expected.not_to permit(master_user, project)
        is_expected.not_to permit(normal_user, project)
        is_expected.to     permit(strong_user, project)
      end
    end
  end
end
