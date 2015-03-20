#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
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

  describe '#_with_zabbix' do
    controller do
      before_action do
        _with_zabbix do
          render text: 'fail!!', status: 400
        end
      end
      def index
        render text: 'success!'
      end
    end

    let(:req){get :index}

    context 'when zabbix server running' do
      run_zabbix_server

      should_be_success
    end

    context 'when zabbix server not running' do
      let(:state){double('server-state', is_running?: false)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        req
      end

      should_be_failure
    end
  end

  describe '#with_zabbix_or_render' do
    controller do
      before_action :with_zabbix_or_render
      def index;end
    end

    let(:req){get :index}

    context 'when zabbix server not running' do
      let(:state){double('server-state', is_running?: false)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        req
      end

      should_be_failure
    end
  end

  describe '#with_zabbix_or_back' do
    controller do
      before_action :with_zabbix_or_back
      def index;end
    end

    let(:req){request.env['HTTP_REFERER'] = 'http://example.com/hoge'; get :index}

    context 'when zabbix server not running' do
      let(:state){double('server-state', is_running?: false)}
      before do
        allow(ServerState).to receive(:new).and_return(state)
        req
      end

      it{is_expected.to redirect_to :back}
    end
  end
end
