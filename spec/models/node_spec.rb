#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Node, type: :model do

  describe ".bootstrap" do
    before do
      status = double()
      expect(status).to receive(:success?).and_return(true)
      expect(Open3).to receive(:capture3).and_return(['out','err', status])
      allow_any_instance_of(EC2Instance).to receive(:platform).and_return("platform")
      allow_any_instance_of(EC2Instance).to receive(:password).and_return("password")
      expect(ChefAPI).to receive(:server_url).and_return('http://example.com/hoge/fuga')
    end

    let(:infra){build(:infrastructure)}

    it "returns true if status is success" do
      expect(Node.bootstrap("hoge", "fuga", infra)).to be_a Node
    end
  end

  describe "#cook" do
    subject { Node.new("test") }

    before do
      allow(Open3).to receive(:popen3)
      allow_any_instance_of(EC2Instance).to receive(:platform).and_return("platform")
      allow_any_instance_of(EC2Instance).to receive(:password).and_return("password")
      allow_any_instance_of(EC2Instance).to receive(:fqdn).and_return("fqdn")
    end

    let(:infra){build(:infrastructure)}
    let(:whyrun){false}

    it "returns true if status is success" do
      expect(subject.cook(infra, whyrun)).to be_truthy
    end
  end

  describe "#run_ansible_playbook" do
    subject { Node.new("test") }
    let(:infra){build(:infrastructure)}

    before do
      allow(Ansible).to receive(:open).and_return(true)
      ec2_instance = double("ec2_instance")
      allow(ec2_instance).to receive(:fqdn).and_return('test.test')
      allow(infra).to receive(:instance).and_return(ec2_instance)
    end

    it "returns true if status is success" do
      expect(subject.run_ansible_playbook(infra, [], '{}')).to eq true
    end
  end

  describe '#all_recipe' do
    subject { Node.new("test") }

    before do
      allow(ChefAPI).to receive_message_chain(:find, :run_list).and_return(%w[recipe[hoge] recipe[fuga] recipe[piyo]])
    end

    it 'return all run_list' do
      s = subject.__send__(:all_recipe, %w{role[role1] recipe[bar]})
      expect(s).to match_array %w{recipe[bar] recipe[hoge] recipe[fuga] recipe[piyo]}
    end
  end


  describe ".exec_command" do
    let(:command){'hoge'}

    context 'command succeeded' do
      let(:res){['foo', 'bar', double('status', success?: true)]}

      it 'should call Open3.capture3' do
        expect(Open3).to receive(:capture3).with(command).and_return(res)
        Node.exec_command(command)
      end

      it 'should return out, error and status' do
        allow(Open3).to receive(:capture3).and_return(*res)
      end
    end

    context "command faild" do
      let(:res){['foo', 'bar', double('status', success?: false)]}
      subject{Node.exec_command(command)}

      before do
        allow(Open3).to receive(:capture3).and_return(res)
      end

      it do
        expect{subject}.to raise_error RuntimeError
      end
    end
  end

  describe 'have_auto_generated' do
    subject { Node.new("test") }

    shared_context 'have_auto_generated?' do |bool|
      before do
        r = ['recipe[hoge]', 'recipe[fuga]']
        r << 'recipe[serverspec-handler]' if bool
        allow(subject).to receive(:all_recipe).and_return(r)
      end

      it 'return boolean' do
        expect(subject.have_auto_generated).to __send__(bool ? :be_truthy : :be_falsey)
      end
    end

    context 'have serverspec-handler recipe' do
      include_context 'have_auto_generated?', true
    end

    context 'dont have serverspec-handler recipe' do
      include_context 'have_auto_generated?', false
    end
  end

  describe '#run_serverspec' do
    subject{ Node.new(physical_id) }
    let(:infra){create(:infrastructure)}
    let(:resource){create(:resource, infrastructure: infra)}
    let(:servertest){create(:servertest)}
    let(:physical_id){resource.physical_id}

    before do
      status = double()
      out = <<-EOS
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
      EOS
      allow(status).to receive(:success?).and_return(true)
      allow(Open3).to receive(:capture3).and_return([out, 'err', status])
      allow_any_instance_of(EC2Instance).to receive(:fqdn).and_return("fqdn")
    end

    it 'return hash' do
      serverspecs = [servertest.id]
      expect(subject.run_serverspec(infra.id, serverspecs, false)).to be_kind_of(Hash)
    end

    it 'should update status' do
      serverspecs = [servertest.id]
      subject.run_serverspec(infra.id, serverspecs, false)
      expect(resource.status.servertest.success?).to be true
    end

    context 'when command fail' do
      before do
        expect(Node).to receive(:exec_command).and_raise StandardError
      end

      it 'should update status' do
        serverspecs = [servertest.id]
        expect{subject.run_serverspec(infra.id, serverspecs, false)}.to raise_error StandardError
        expect(resource.status.servertest.failed?).to be true
      end
    end
  end

  describe '#get_error_servertest_names' do
    subject { Node.new("test") }
    let(:run_spec_list){
      [
        {
        name: 'test-spec',
        files: ['./tmp/serverspec/1234567890-1234-abc123']
        }
      ]
    }

    context 'when result has no messages key' do
      let(:result){{}}

      it 'return empty array' do
        s = subject.__send__(:get_error_servertest_names, result, run_spec_list)
        expect(s).to eq []
      end
    end

    context 'when result has messages key' do
      error_message = <<'EOS'

An error occurred while loading ./tmp/serverspec/1234567890-1234-abc123.
On host `ec2-XX-XX-XX-XX.ap-northeast-1.compute.amazonaws.com'
Failure/Error: super
NameError:
  undefined local variable or method `aaaaa' for RSpec::ExampleGroups::CommandLsAl:Class

# ./tmp/serverspec/1234567890-1234-abc123:4:in `block in <top (required)>'
# ./tmp/serverspec/1234567890-1234-abc123:3:in `<top (required)>'
EOS
      let(:result){{messages: [error_message]}}

      it 'return error_servertest_names' do
        s = subject.__send__(:get_error_servertest_names, result, run_spec_list)
        expect(s).to eq ['test-spec']
      end
    end
  end

  describe '#get_relative_path_string' do
    subject { Node.new("test") }

    it 'return relative_path' do
      path = Rails.root.join("a/b/c").to_s
      s = subject.__send__(:get_relative_path_string, path)
      expect(s).to eq './a/b/c'
    end
  end

  describe '#ansible_hosts_text' do
    subject { Node.new("test").__send__(:ansible_hosts_text, infra) }
    let(:infra){create(:infrastructure)}
    before do
      ec2_instance = double("ec2_instance")
      allow(ec2_instance).to receive(:fqdn).and_return('test.test')
      allow(infra).to receive(:instance).and_return(ec2_instance)
    end

    it 'return Ansible hosts text' do
      is_expected.to eq <<'EOS'
[ec2]
test.test ansible_ssh_user=ec2-user
EOS
    end
  end
end
