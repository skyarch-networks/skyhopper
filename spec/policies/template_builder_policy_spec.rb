#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe TemplateBuilderPolicy do
  subject{described_class}

  let(:builder){TemplateBuilder.new}

  %i[new? resource_properties? create?].each do |action|
    permissions action do
      let(:master_admin){build(:user, master: true,  admin: true)}
      let(:master){      build(:user, master: true,  admin: false)}
      let(:admin){       build(:user, master: false, admin: true)}
      let(:normal){      build(:user, master: false, admin: false)}

      it 'should grant only master and admin' do
        is_expected.to     permit(master_admin, builder)
        is_expected.not_to permit(master,       builder)
        is_expected.not_to permit(admin,        builder)
        is_expected.not_to permit(normal,       builder)
      end
    end
  end
end
