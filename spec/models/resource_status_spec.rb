require_relative '../spec_helper'

RSpec.describe ResourceStatus, type: :model do
  describe '#success?' do
    subject{status.success?}
    context 'when success' do
      let(:status){create(:resource_status, value: ResourceStatus::Success)}
      it {is_expected.to be true}
    end

    context 'when not success' do
      let(:status){create(:resource_status, value: ResourceStatus::Failed)}
      it {is_expected.to be false}
    end
  end

  describe '#failed?' do
    subject{status.failed?}
    context 'when failed' do
      let(:status){create(:resource_status, value: ResourceStatus::Failed)}
      it {is_expected.to be true}
    end

    context 'when not failed' do
      let(:status){create(:resource_status, value: ResourceStatus::Success)}
      it {is_expected.to be false}
    end
  end

  describe '#pending?' do
    subject{status.pending?}
    context 'when pending' do
      let(:status){create(:resource_status, value: ResourceStatus::Pending)}
      it {is_expected.to be true}
    end

    context 'when not pending' do
      let(:status){create(:resource_status, value: ResourceStatus::Success)}
      it {is_expected.to be false}
    end
  end

  describe '#un_executed?' do
    subject{status.un_executed?}
    context 'when un_executed' do
      let(:status){create(:resource_status, value: ResourceStatus::UnExecuted)}
      it {is_expected.to be true}
    end

    context 'when not un_executed' do
      let(:status){create(:resource_status, value: ResourceStatus::Success)}
      it {is_expected.to be false}
    end
  end

  describe '#in_progress?' do
    subject{status.in_progress?}
    context 'when in_progress' do
      let(:status){create(:resource_status, value: ResourceStatus::InProgress)}
      it {is_expected.to be true}
    end

    context 'when not in_progress' do
      let(:status){create(:resource_status, value: ResourceStatus::Success)}
      it {is_expected.to be false}
    end
  end
end
