#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe AppSetting, type: :model do
  let(:klass){AppSetting}

  describe 'with validation' do
    let(:set){build(:app_setting)}

    describe 'column log_directory' do
      it 'should be pathname' do
        set.log_directory = 'hogehoge'
        expect(set.valid?).to be false
        set.log_directory = '~/hogehoge'
        expect(set.valid?).to be true
      end

      it 'or should be DummyText' do
        set.log_directory = DummyText
        expect(set.valid?).to be true
      end
    end

    describe 'column aws_region' do
      it 'should include regions' do
        AWS::Regions.each do |region|
          set.aws_region = region
          expect(set.valid?).to be true
        end
        set.aws_region = 'invalid-as-region'
        expect(set.valid?).to be false
      end
    end
  end

  describe '.get' do
    before do
      create(:app_setting)
      klass.clear_cache
    end

    subject{klass.get}
    it 'should return AppSetting.first' do
      is_expected.to eq klass.first
    end

    it 'should memolize' do
      subject
      expect(Rails.cache.read('app_setting')).to be_a klass
    end
  end

  describe '.set?' do
    context 'when already setting' do
      before do
        create(:app_setting)
      end

      subject{klass.set?}

      it{is_expected.to be true}
    end

    context 'when have not setting' do
      before do
        klass.delete_all
      end

      subject{klass.set?}

      it{is_expected.to be_falsey}
    end

    context 'when have dummy setting' do
      before do
        klass.delete_all
        create(:app_setting, aws_region: ::DummyText)
      end

      subject{klass.clear_cache;klass.set?}

      it{is_expected.to be_falsey}
    end
  end

  describe '.clear_dummy' do
    before do
      create(:app_setting, aws_region: ::DummyText)
    end

    it 'should clear dummy setting' do
      klass.clear_dummy
      expect(klass.all.none?(&:dummy?)).to be true
    end
  end

  describe '.clear_cache' do
    before do
      Rails.cache.write('app_setting', 'foo')
    end

    subject{klass.clear_cache}

    it 'should clear cache' do
      expect(Rails.cache.read('app_setting')).not_to be_nil
      subject
      expect(Rails.cache.read('app_setting')).to be_nil
    end
  end

  describe '#dummy?' do
    context 'when dummy' do
      subject{build(:app_setting, aws_region: ::DummyText)}

      it 'should return true' do
        expect(subject.dummy?).to be true
      end
    end

    context 'when not dummy' do
      subject{build(:app_setting)}

      it 'should return false' do
        expect(subject.dummy?).to be false
      end
    end
  end
end
