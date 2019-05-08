require 'rails_helper'

RSpec.describe ZabbixServer, type: :model do
  describe 'with validation' do
    describe 'column fqdn' do
      let(:zb) { build(:zabbix_server) }

      it 'should not be "master"' do
        zb.fqdn = 'master'
        expect(zb.save).to be false
      end

      it 'should not end "-read"' do
        zb.fqdn = 'hoge-read'
        expect(zb.save).to be false
      end

      it 'should not end "-read-write"' do
        zb.fqdn = 'fuga-read-write'
        expect(zb.save).to be false
      end
    end
  end

  describe 'with restrict_with_error' do
    stubize_zabbix
    let(:zabbix_server) { create :zabbix_server }

    context 'when zabbix_server has some infra' do
      before do
        zabbix_server.projects = create_list :project, 3
        zabbix_server.reload
      end

      it 'cant destroy' do
        expect { zabbix_server.destroy }.to raise_error ActiveRecord::DeleteRestrictionError
        expect(ZabbixServer).to be_exists zabbix_server.id
      end
    end

    context 'when zabbix_server does not have any inra' do
      it 'can destroy' do
        expect { zabbix_server.destroy }.not_to raise_error
        expect(ZabbixServer).not_to be_exists zabbix_server.id
      end
    end
  end
end
