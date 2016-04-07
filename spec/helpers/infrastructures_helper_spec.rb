#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe InfrastructuresHelper do
  let(:infra){build_stubbed(:infrastructure)}
  let(:user){build_stubbed(:user)}
  let(:normal_user){build_stubbed(:user, master: nil, admin: nil)}


  before do
    helper.instance_variable_set(:@virtual_path, 'infrastructures')
  end

  describe '#edit_infra' do
    subject{helper.edit_infra(infra, user: user)}

    context 'when editable user' do
      it {is_expected.not_to be nil}
    end

    context 'when not editable user' do
      let(:user){normal_user}

      it {is_expected.to be nil}
    end
  end

  describe '#button_detach_stack' do
    subject{helper.button_detach_stack(infra, user: user)}

    context 'when detachable user' do
      it {is_expected.to be true}
      it {is_expected.not_to be nil}
    end

    context 'when not detachable user' do
      let(:user){normal_user}
      it {is_expected.to be nil}
    end

    context 'when infra deleting' do
      let(:infra){build_stubbed(:infrastructure, status: 'DELETE_IN_PROGRESS')}

      it {is_expected.to be nil}
    end
  end

  describe '#button_delete_stack' do
    subject{helper.button_delete_stack(infra, user: user)}

    context 'when deletable user' do
      it {is_expected.to be true}
      it {is_expected.not_to be nil}
    end

    context 'when not deletable user' do
      let(:user){normal_user}
      it {is_expected.to be nil}
    end

    context 'when infra deleting' do
      let(:infra){build_stubbed(:infrastructure, status: 'DELETE_IN_PROGRESS')}
      it {is_expected.to be nil}
    end

    context 'when infra status is blank' do
      let(:infra){build_stubbed(:infrastructure, status: nil)}
      it {is_expected.to be nil}
    end
  end

  describe '#button_add_infra' do
    let(:project){create(:project)}
    subject{helper.button_add_infra(project, user: user)}

    context 'when addable uesr' do
      it {is_expected.not_to be nil}
    end

    context 'when not addable user' do
      let(:user){normal_user}
      it {is_expected.to be nil}
    end
  end

  describe '#deleting?' do
    subject{helper.__send__(:deleting?, status)}

    context 'when status is nil' do
      let(:status){nil}

      it {is_expected.to be false}
    end

    context 'when status is DELETE_FAILED' do
      let(:status){'DELETE_FAILED'}

      it {is_expected.to be false}
    end

    context 'when status includes "DELETE"' do
      let(:status){'DELETE_IN_PROGRESS'}

      it {is_expected.to be true}
    end

    context 'when status doesnot include "DELETE"' do
      let(:status){'CREATE_COMPLETE'}

      it {is_expected.to be false}
    end
  end
end
