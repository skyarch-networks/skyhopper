#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe CfTemplate, :type => :model do
  let(:klass){CfTemplate}

  describe 'with validation' do
    describe 'column value' do
      let(:cft){build(:cf_template)}

      it 'should be a JSON' do
        cft.value = "{Invalid As JSON!}"
        expect(cft.save).to be false
        cft.value = '{"valid": "as JSON"}'
        expect(cft.save).to be true
      end
    end
  end

  describe '.for_infra' do
    let(:infra){create(:infrastructure)}
    subject{klass.for_infra(infra.id)}

    before do
      create(:cf_template, infrastructure: infra)
    end

    it 'should return cf_templates for infra' do
      expect(subject).to be_all{|t|t.infrastructure_id == infra.id}
    end
  end

  describe '.global' do
    subject{klass.global}

    before do
      create(:cf_template, infrastructure: nil)
    end

    it 'should return global cf_templates' do
      expect(subject).to be_all{|t|t.infrastructure_id.nil?}
    end
  end

  # TODO:
  describe '#create_cfparams_set' do
    skip
  end

  describe '#parsed_cfparams' do
    subject{cf_template.parsed_cfparams}

    context 'when assign @params_not_json' do
      let(:cf_template){create(:cf_template)}
      let(:params_not_json){{foo: 'bar'}}

      before do
        cf_template.instance_variable_set(:@params_not_json, params_not_json)
      end

      it 'should return @params_not_json' do
        expect(subject).to eq params_not_json
      end
    end

    context 'when not assign @params_not_json' do
      let(:params){JSON[{foo: 'hogehoge'}]}
      let(:cf_template){create(:cf_template, params: params)}

      before do
        cf_template.instance_variable_set(:@params_not_json, nil)
      end

      it 'should return params parsed as JSON' do
        expect(subject).to eq JSON[params]
      end
    end
  end

  describe '#update_cfparams' do
    let(:params_not_json){{'foo' => 'hogefuga'}}
    let(:cf_template){create(:cf_template)}
    subject{cf_template.update_cfparams}

    before do
      cf_template.params = nil
      cf_template.instance_variable_set(:@params_not_json, params_not_json)
    end

    it 'should set CfTemplate#params' do
      subject
      expect(cf_template.params).to eq params_not_json.to_json
    end
  end
end
