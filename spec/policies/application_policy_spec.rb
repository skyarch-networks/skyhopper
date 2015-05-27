require_relative '../spec_helper'

describe ApplicationPolicy do
  subject{described_class}
  let(:master_user){build(:user, master: true,  admin: false)}
  let(:admin_user) {build(:user, master: false, admin: true)}
  let(:normal_user){build(:user, master: false, admin: false)}

  let(:obj){''}
  %i[index? show?].each do |action|
    permissions action do
      it 'grants access if user is a master' do
        is_expected.to permit(master_user, obj)
      end

      it 'denies access if user is an admin' do
        is_expected.not_to permit(admin_user, obj)
      end

      it 'denies access if user is not master' do
        is_expected.not_to permit(normal_user, obj)
      end
    end
  end

  %i[create? new? update? edit? destroy?].each do |action|
    permissions action do
      it 'denies access if user is a master' do
        is_expected.not_to permit(master_user, obj)
      end

      it 'grants access if user is an admin' do
        is_expected.to permit(admin_user, obj)
      end

      it 'denies access if user is not master' do
        is_expected.not_to permit(normal_user, obj)
      end
    end
  end
end
