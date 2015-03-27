require_relative '../spec_helper'

RSpec.describe ServerspecJob, type: :job do
  describe '#perform' do
    let(:infra){create(:infrastructure)}
    let(:physical_id){SecureRandom.base64(10)}
    let(:serverspecs){create_list(:serverspec, 3)}
    let(:resource){create(:resource, physical_id: physical_id, infrastructure: infra, serverspecs: serverspecs)}

    before do
      resource
    end

    it 'should call Node#run_serverspec' do
      expect_any_instance_of(Node).to receive(:run_serverspec).with(infra.id, serverspecs.map(&:id), false)
      ServerspecJob.perform_now(physical_id, infra.id)
    end

    context 'when error' do
      before do
        expect_any_instance_of(Node).to receive(:run_serverspec).with(infra.id, serverspecs.map(&:id), false).and_raise
      end

      it 'should call Node#run_serverspec' do
        ServerspecJob.perform_now(physical_id, infra.id)
      end
    end
  end
end
