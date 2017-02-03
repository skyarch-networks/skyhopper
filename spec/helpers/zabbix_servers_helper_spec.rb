require_relative '../spec_helper'

# Specs in this file have access to a helper object that includes
# the ZabbixServersHelper. For example:
#
# describe ZabbixServersHelper do
#   describe "string concat" do
#     it "concats two strings with spaces" do
#       expect(helper.concat_strings("this","that")).to eq("this that")
#     end
#   end
# end

describe ZabbixServersHelper do
  let(:zabbix){build_stubbed(:zabbix_server)}
  let(:user){build_stubbed(:user)}
  let(:normal_user){build_stubbed(:user, master: nil, admin: nil)}

  describe "#edit_zabbix_server_path_url" do
    subject{helper.edit_zabbix_server_path_url(zabbix, user: user)}

    context 'when editable user' do
      let(:zabbix){build_stubbed(:zabbix_server)}
      it {is_expected.not_to be nil}
    end

    context 'when not editable user' do
      let(:user){normal_user}

      it {is_expected.to be nil}
    end
  end

  describe "#delete_zabbix_server_path" do
    subject{helper.delete_zabbix_server_path(zabbix, user: user)}

    context 'when editable user' do
      let(:zabbix){build_stubbed(:zabbix_server)}

      it {is_expected.not_to be nil}
      it 'zabbix id should not be equal to 1' do
        expect(zabbix.id).not_to eq(1)
      end
    end

    context 'when not editable user' do
      let(:user){normal_user}
      it {is_expected.to be nil}
    end
  end
end
