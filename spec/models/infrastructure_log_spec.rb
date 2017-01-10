#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe InfrastructureLog, type: :model do
  let(:klass){InfrastructureLog}
  let(:infra){build_stubbed(:infrastructure)}
  let(:user){build_stubbed(:user)}

  it {is_expected.to respond_to(:infrastructure_id)}
  it {is_expected.to respond_to(:status)}
  it {is_expected.to respond_to(:details)}
  it {is_expected.to respond_to(:user_id)}

  describe 'scope security_update' do
    let(:physical_id){'i-hogehoge'}
    let(:security_log){
      create(:infrastructure_log, details: <<EOS, infrastructure: infra)
yum check security update for #{physical_id} is successfully finished.

log:
Loaded plugins: priorities, update-motd, upgrade-helper
33 package(s) needed for security, out of 66 available

curl.x86_64                          7.40.0-3.52.amzn1              amzn-updates
e2fsprogs.x86_64                     1.42.12-4.35.amzn1             amzn-updates
e2fsprogs-libs.x86_64                1.42.12-4.35.amzn1             amzn-updates
glibc.x86_64                         2.17-55.143.amzn1              amzn-updates
glibc-common.x86_64                  2.17-55.143.amzn1              amzn-updates
gnupg2.x86_64                        2.0.28-1.30.amzn1              amzn-updates
gpgme.x86_64                         1.4.3-5.15.amzn1               amzn-updates
kernel.x86_64                        3.14.48-33.39.amzn1            amzn-updates
kernel-tools.x86_64                  3.14.48-33.39.amzn1            amzn-updates
krb5-libs.x86_64                     1.12.2-14.43.amzn1             amzn-updates
libcap-ng.x86_64                     0.7.3-5.13.amzn1               amzn-updates
libcom_err.x86_64                    1.42.12-4.35.amzn1             amzn-updates
libcurl.x86_64                       7.40.0-3.52.amzn1              amzn-updates
libgcrypt.x86_64                     1.5.3-12.18.amzn1              amzn-updates
libjpeg-turbo.x86_64                 1.2.90-5.10.amzn1              amzn-updates
libss.x86_64                         1.42.12-4.35.amzn1             amzn-updates
nss.x86_64                           3.19.1-3.71.amzn1              amzn-updates
nss-sysinit.x86_64                   3.19.1-3.71.amzn1              amzn-updates
nss-tools.x86_64                     3.19.1-3.71.amzn1              amzn-updates
nss-util.x86_64                      3.19.1-1.41.amzn1              amzn-updates
openssh.x86_64                       6.2p2-8.44.amzn1               amzn-updates
openssh-clients.x86_64               6.2p2-8.44.amzn1               amzn-updates
openssh-server.x86_64                6.2p2-8.44.amzn1               amzn-updates
pcre.x86_64                          8.21-7.7.amzn1                 amzn-updates
python27-botocore.noarch             1.1.5-1.21.amzn1               amzn-updates
python27-pip.noarch                  6.1.1-1.20.amzn1               amzn-updates
ruby20.x86_64                        2.0.0.645-1.27.amzn1           amzn-updates
ruby20-irb.noarch                    2.0.0.645-1.27.amzn1           amzn-updates
ruby20-libs.x86_64                   2.0.0.645-1.27.amzn1           amzn-updates
rubygem20-bigdecimal.x86_64          1.2.0-1.27.amzn1               amzn-updates
rubygem20-psych.x86_64               2.0.0-1.27.amzn1               amzn-updates
rubygems20.noarch                    2.0.14-1.27.amzn1              amzn-updates
unzip.x86_64                         6.0-2.9.amzn1                  amzn-updates
EOS
    }
    let(:not_security_log){create(:infrastructure_log, details: "yum check security update for #{physical_id} is started.", infrastructure: infra)}
    before do
      security_log
      not_security_log
    end

    subject{InfrastructureLog.security_update(physical_id)}

    it {is_expected.to be_include security_log}
    it {is_expected.not_to be_include not_security_log}
  end

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

  describe '.number_of_security_updates' do
    let(:physical_id){SecureRandom.hex(20)}
    let(:infra){create(:infrastructure)}
    subject{InfrastructureLog.number_of_security_updates(infra.id, physical_id)}

    context 'when log does not exist' do
      it {is_expected.to be_nil}
    end

    context 'when Complete' do
      before do
        create(:infrastructure_log, details: <<EOS, infrastructure: infra)
yum check security update for #{physical_id} is successfully finished.

Complete!
EOS
      end
      it {is_expected.to eq 0}
    end

    context 'when have needed for security' do
      before do
        create(:infrastructure_log, details: <<EOS, infrastructure: infra)
yum check security update for #{physical_id} is successfully finished.

33 package(s) needed for security, out of 66 available
EOS
      end
      it {is_expected.to eq 33}
    end
  end
end
