#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe ApplicationController do

  describe '#restore_locale' do
    controller do
      def index
        render text: 'success'
      end
    end
    let(:req){get :index, lang: lang}
    before{I18n.locale = I18n.default_locale}

    context 'when lang is nil' do
      let(:lang){nil}
      before{req}
      should_be_success
      it 'should be default' do
        expect(I18n.locale).to eq I18n.default_locale
      end
    end

    context 'when lang is en' do
      let(:lang){:en}
      before{req}
      should_be_success
      it 'should be en' do
        expect(I18n.locale).to eq lang
      end
    end

    context 'when lang is invalid' do
      let(:lang){:hogefugalang}
      before{req}
      should_be_success
      it 'should be default' do
        expect(I18n.locale).to eq I18n.default_locale
      end
    end
  end
end
