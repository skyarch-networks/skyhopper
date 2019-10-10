#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Node, type: :model do
  describe '#run_ansible_playbook' do
    subject { Node.new('test') }
    let(:infra) { build(:infrastructure) }

    before do
      allow(Ansible).to receive(:create).and_return(true)
      ec2_instance = double('ec2_instance')
      allow(ec2_instance).to receive(:fqdn).and_return('test.test')
      allow(infra).to receive(:instance).and_return(ec2_instance)
    end

    it 'returns true if status is success' do
      expect(subject.run_ansible_playbook(infra, [], '{}')).to eq true
    end
  end

  describe '.exec_command' do
    let(:command) { 'hoge' }

    context 'command succeeded' do
      let(:res) { ['foo', 'bar', double('status', success?: true)] }

      it 'should call Open3.capture3' do
        expect(Open3).to receive(:capture3).with(command).and_return(res)
        Node.exec_command(command)
      end

      it 'should return out, error and status' do
        allow(Open3).to receive(:capture3).and_return(*res)
      end
    end

    context 'command faild' do
      let(:res) { ['foo', 'bar', double('status', success?: false)] }
      subject { Node.exec_command(command) }

      before do
        allow(Open3).to receive(:capture3).and_return(res)
      end

      it do
        expect { subject }.to raise_error RuntimeError
      end
    end
  end

  describe '#run_serverspec' do
    subject { Node.new(physical_id) }
    let(:infra) { create(:infrastructure) }
    let(:resource) { create(:resource, infrastructure: infra) }
    let(:servertest) { create(:servertest) }
    let(:physical_id) { resource.physical_id }

    before do
      status = double
      out = <<~OUTPUT
        {
          "examples": [
            {
              "exception": {
                "backtrace": "piyo"
              },
              "status": "passed",
              "full_description": "aaaa",
              "command": "bbbb"
            }
          ],
          "summary": {
            "failure_count": 0,
            "pending_count": 0,
            "errors_outside_of_examples_count": 0
          },
          "summary_line": "1 example, 0 failures"
        }
      OUTPUT
      allow(status).to receive(:success?).and_return(true)
      allow(Open3).to receive(:capture3).and_return([out, 'err', status])
      allow_any_instance_of(EC2Instance).to receive(:fqdn).and_return('fqdn')
    end

    it 'return hash' do
      serverspecs = [servertest.id]
      expect(subject.run_serverspec(infra.id, serverspecs)).to be_kind_of(Hash)
    end

    it 'should update status' do
      serverspecs = [servertest.id]
      subject.run_serverspec(infra.id, serverspecs)
      expect(resource.status.servertest.success?).to be true
    end

    context 'when command fail' do
      before do
        expect(Node).to receive(:exec_command).and_raise StandardError
      end

      it 'should update status' do
        serverspecs = [servertest.id]
        expect { subject.run_serverspec(infra.id, serverspecs) }.to raise_error StandardError
        expect(resource.status.servertest.failed?).to be true
      end
    end
  end

  describe '#get_error_servertest_names' do
    subject { Node.new('test') }
    let(:run_spec_list) do
      [
        {
          name: 'test-spec',
          file: './tmp/serverspec/1234567890-1234-abc123',
        },
      ]
    end

    context 'when result has no messages key' do
      let(:result) { {} }

      it 'return empty array' do
        s = subject.__send__(:get_error_servertest_names, result, run_spec_list)
        expect(s).to eq []
      end
    end

    context 'when result has messages key' do
      error_message = <<~'MESSAGE'

        An error occurred while loading ./tmp/serverspec/1234567890-1234-abc123.
        On host `ec2-XX-XX-XX-XX.ap-northeast-1.compute.amazonaws.com'
        Failure/Error: super
        NameError:
          undefined local variable or method `aaaaa' for RSpec::ExampleGroups::CommandLsAl:Class

        # ./tmp/serverspec/1234567890-1234-abc123:4:in `block in <top (required)>'
        # ./tmp/serverspec/1234567890-1234-abc123:3:in `<top (required)>'
      MESSAGE
      let(:result) { { messages: [error_message] } }

      it 'return error_servertest_names' do
        s = subject.__send__(:get_error_servertest_names, result, run_spec_list)
        expect(s).to eq ['test-spec']
      end
    end
  end

  describe '#get_relative_path_string' do
    subject { Node.new('test') }

    it 'return relative_path' do
      path = Rails.root.join('a', 'b', 'c').to_s
      s = subject.__send__(:get_relative_path_string, path)
      expect(s).to eq './a/b/c'
    end
  end

  describe '#ansible_hosts_text' do
    subject { Node.new('test').__send__(:ansible_hosts_text, infra) }
    let(:infra) { create(:infrastructure) }
    before do
      ec2_instance = double('ec2_instance')
      allow(ec2_instance).to receive(:fqdn).and_return('test.test')
      allow(infra).to receive(:instance).and_return(ec2_instance)
    end

    it 'return Ansible hosts text' do
      is_expected.to eq <<~'HOSTS'
        [ec2]
        test.test ansible_ssh_user=ec2-user
      HOSTS
    end
  end
end
