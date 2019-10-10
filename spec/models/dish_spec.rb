#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe Dish, type: :model do
  let(:klass) { Dish }
  describe 'Dish::STATUS' do
    subject { klass::STATUS }
    it { is_expected.to be_frozen }
  end

  describe '#update_status' do
    subject { build(:dish) }
    let(:arg) { :success }

    it 'should update status and save' do
      expect(subject).to receive(:status=).with(klass::STATUS[arg])
      expect(subject).to receive(:save!).with(no_args)
      subject.update_status(arg)
    end
  end

  describe '#validating?' do
    subject { build(:dish) }

    [Dish::STATUS[:creating], Dish::STATUS[:bootstrapping], Dish::STATUS[:applying], Dish::STATUS[:serverspec]].each do |sym|
      context "when #{sym}" do
        before do
          allow(subject).to receive(:status).and_return(sym)
        end

        it do
          expect(subject.validating?).to be true
        end
      end
    end

    [Dish::STATUS[:success], Dish::STATUS[:failure]].each do |sym|
      context "when #{sym}" do
        before do
          allow(subject).to receive(:status).and_return(sym)
        end

        it do
          expect(subject.validating?).to be false
        end
      end
    end
  end

  describe '#playbook_roles_safe' do
    subject { dish.playbook_roles_safe }

    context 'when playbook_roles is nil' do
      let(:dish) { build(:dish) }

      before do
        dish.playbook_roles = nil
      end

      it { is_expected.to eq [] }
    end

    context 'when playbook_roles is \'["aaa", "bbb"]\'(JSON string)' do
      let(:dish) { build(:dish) }

      before do
        dish.playbook_roles = '["aaa", "bbb"]'
      end

      it { is_expected.to eq %w[aaa bbb] }
    end
  end

  describe '#extra_vars_safe' do
    subject { dish.extra_vars_safe }

    context 'when extra_vars is nil' do
      let(:dish) { build(:dish) }

      before do
        dish.extra_vars = nil
      end

      it { is_expected.to eq '{}' }
    end

    context 'when extra_vars is not nil' do
      let(:dish) { build(:dish) }

      before do
        dish.extra_vars = '{"aaa":"abc"}'
      end

      it { is_expected.to eq '{"aaa":"abc"}' }
    end
  end

  describe '.valid_dishes' do
    let(:valids) { create_list(:dish, 3, project_id: nil, status: 'SUCCESS') }
    let(:invalids) { create_list(:dish, 3, project_id: nil, status: 'FAILURE') }
    before do
      valids
      invalids
    end

    subject { klass.valid_dishes }
    it 'return only valid dishes' do
      expect(subject).to eq valids
    end
  end

  describe '#verify_playbook_roles' do
    subject { dish.__send__(:verify_playbook_roles) }

    context 'when playbook_roles is valid' do
      let(:dish) { build(:dish) }

      before do
        dish.playbook_roles = '["aaa", "bbb"]'
        subject
      end

      it 'should number of errors[:playbook_roles] is 0' do
        expect(dish.errors[:playbook_roles].length).to eq 0
      end
    end

    context 'when playbook_roles is invalid' do
      let(:dish) { build(:dish) }

      before do
        dish.playbook_roles = '["aaa", 123]'
        subject
      end

      it 'should number of error[:playbook_roles] is not 0' do
        expect(dish.errors[:playbook_roles].length).not_to eq 0
      end
    end
  end
end
