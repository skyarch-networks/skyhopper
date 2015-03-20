#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe AppSetting, :type => :model do
  let(:klass){AppSetting}

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
      expect(klass.class_variable_get(:@@get)).to be_kind_of klass
    end
  end

  describe '.set?' do
    context 'when already setting' do
      before do
        create(:app_setting)
      end

      subject{klass.set?}

      it{is_expected.to be_truthy}
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

      subject{klass.class_variable_set(:@@get, nil);klass.set?}

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
      klass.class_variable_set(:@@get, 'foo')
    end

    subject{klass.clear_cache}

    it 'should clear cache' do
      expect(klass.class_variable_get(:@@get)).not_to be_nil
      subject
      expect(klass.class_variable_get(:@@get)).to be_nil
    end
  end

  describe '.attrs' do
    it do
      expect(klass.attrs).to be_kind_of Array
    end

    it 'should memolize' do
      klass.attrs
      expect(klass.class_variable_get(:@@attrs)).to eq klass.attrs
    end
  end

  describe '.validate' do
    context 'when invalid path' do
      let(:arg){{log_directory: ''}}

      before do
        allow(klass).to receive(:is_pathname?).and_return(false)
      end

      it do
        expect{klass.validate(arg)}.to raise_error klass::ValidateError
      end
    end

    context 'when invalid region' do
      let(:arg){{aws_region: 'hoge-region'}}

      it do
        expect{klass.validate(arg)}.to raise_error klass::ValidateError
      end
    end

    context 'when valid setting' do
      let(:arg){{log_directory: '/foo/bar'}}

      it 'should return true' do
        expect(klass.validate(arg)).to be_truthy
      end
    end
  end

  describe '.is_pathname?' do
    describe 'should private method' do
      subject{klass.is_pathname?('foo')}
      it do
        expect{subject}.to raise_error NoMethodError
      end
    end

    context 'when valid path' do
      it 'should return true' do
        expect(klass.__send__(:is_pathname?, '/foo/bar/')).to be_truthy
      end

      it 'should return true' do
        expect(klass.__send__(:is_pathname?, '~/foo/bar/')).to be_truthy
      end
    end

    context 'when invalid path' do
      it 'should return false' do
        expect(klass.__send__(:is_pathname?, 'foo/bar')).to be_falsy
      end
    end
  end

  describe 'dummy?' do
    context 'when dummy' do
      subject{create(:app_setting, aws_region: ::DummyText)}

      it 'should return true' do
        expect(subject.dummy?).to be true
      end
    end

    context 'when not dummy' do
      subject{create(:app_setting)}

      it 'should return false' do
        expect(subject.dummy?).to be false
      end
    end
  end
end
