#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe InfrastructureLog, :type => :model do
  let(:klass){InfrastructureLog}
  let(:infra){build_stubbed(:infrastructure)}
  let(:user){build_stubbed(:user)}

  it {is_expected.to respond_to(:infrastructure_id)}
  it {is_expected.to respond_to(:status)}
  it {is_expected.to respond_to(:details)}
  it {is_expected.to respond_to(:user_id)}

  describe '.for_infra' do
    let(:logs){create_list :infrastructure_log, 3, infrastructure: infra}
    subject{klass.for_infra(infra.id)}

    it 'should only infras log' do
      logs
      expect(subject).to be_all{|x|x.infrastructure_id == infra.id}
    end
  end

  describe '.success' do
    it 'should be defined' do
      expect(defined? klass.success).to eq 'method'
    end

    subject{klass.success(infrastructure_id: infra.id, details: 'details', user_id: user.id)}

    it {is_expected.to be_kind_of klass}

    it 'should be success' do
      expect(subject.status).to be true
    end
  end

  describe '.fail' do
    it 'should be defined' do
      expect(defined? klass.fail).to eq 'method'
    end

    subject{klass.fail(infrastructure_id: infra.id, details: 'details', user_id: user.id)}

    it {is_expected.to be_kind_of klass}

    it 'should be success' do
      expect(subject.status).to be false
    end
  end
end
