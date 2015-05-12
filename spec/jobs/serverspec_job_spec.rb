require_relative '../spec_helper'

RSpec.describe ServerspecJob, type: :job do
  describe '#perform' do
    let(:infra){create(:infrastructure)}
    let(:physical_id){SecureRandom.base64(10)}
    let(:serverspecs){create_list(:serverspec, 3)}
    let(:resource){create(:resource, physical_id: physical_id, infrastructure: infra, serverspecs: serverspecs)}
    let(:user){create(:user)}
    let(:status_text){'success'}
    let(:resp){{
      status_text: status_text,
      message: 'Success!',
      status: status_text != 'failed',
    }}
    let(:job){ServerspecJob.perform_now(physical_id, infra.id, user.id)}

    before do
      allow_any_instance_of(Node).to receive(:run_serverspec).with(infra.id, serverspecs.map(&:id), false).and_return(resp)
      resource
    end

    it 'should return resp' do
      expect(job).to eq resp
    end

    context 'when received serverspec_ids' do
      let(:altr_serverspecs){create_list(:serverspec, 4)}
      it 'serverspec_ids of resource should be update' do
        ids = altr_serverspecs.map(&:id)
        allow_any_instance_of(Node).to receive(:run_serverspec).with(infra.id, ids, false).and_return(resp)
        ServerspecJob.perform_now(physical_id, infra.id, user.id, serverspec_ids: ids)
        resource.reload
        expect(resource.serverspecs).to eq altr_serverspecs
      end
    end

    context 'when raise error' do
      before do
        allow_any_instance_of(Node).to receive(:run_serverspec).and_raise
      end

      it 'should raise error' do
        expect{job}.to raise_error
      end

      it 'should create infra log' do
        expect{job rescue nil}.to change(InfrastructureLog, :count).by(1)
      end

      it 'should be failure' do
        job rescue nil
        expect(InfrastructureLog.last.status).to be false
      end
    end

    context 'when status success' do
      let(:status_text){'success'}

      it 'should create infra log' do
        expect{job}.to change(InfrastructureLog, :count).by(1)
      end

      it 'should be success' do
        job
        expect(InfrastructureLog.last.status).to be true
      end
    end

    context 'when status pending' do
      let(:status_text){'pending'}

      it 'should create infra log' do
        expect{job}.to change(InfrastructureLog, :count).by(1)
      end

      it 'should be success' do
        job
        expect(InfrastructureLog.last.status).to be true
      end
    end

    context 'when status pending' do
      let(:status_text){'failed'}

      it 'should create infra log' do
        expect{job}.to change(InfrastructureLog, :count).by(1)
      end

      it 'should be failure' do
        job
        expect(InfrastructureLog.last.status).to be false
      end
    end
  end
end
