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
    let(:serverspec){create(:serverspec)}
    let(:physical_id){resource.physical_id}

    before do
      status = double()
      out = <<-EOS
{
  "examples": [
    {
      "exception": {
        "backtrace": "piyo"
      }
    }
  ],
  "summary": {
    "failure_count": 0,
    "pending_count": 0
  }
}
      EOS
      allow(status).to receive(:success?).and_return(true)
      allow(Open3).to receive(:capture3).and_return([out, 'err', status])
      allow_any_instance_of(EC2Instance).to receive(:fqdn).and_return("fqdn")
    end

    it 'return hash' do
      serverspecs = [serverspec.id]
      expect(subject.run_serverspec(infra.id, serverspecs, false)).to be_kind_of(Hash)
    end

    it 'should update status' do
      serverspecs = [serverspec.id]
      subject.run_serverspec(infra.id, serverspecs, false)
      expect(resource.status.serverspec.success?).to be true
    end

    context 'when command fail' do
      before do
        expect(Node).to receive(:exec_command).and_raise StandardError
      end

      it 'should update status' do
        serverspecs = [serverspec.id]
        expect{subject.run_serverspec(infra.id, serverspecs, false)}.to raise_error StandardError
        expect(resource.status.serverspec.failed?).to be true
      end
    end
  end
end
