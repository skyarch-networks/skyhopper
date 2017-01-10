#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

describe TemplateBuilderController, type: :controller do
  login_user

  let(:klass){TemplateBuilder}

  describe '#new' do
    before do
      get :new
    end

    it 'should assign @resources' do
      expect(assigns[:resources]).to eq klass.resources
    end
  end

  describe '#resource_properties' do
    let(:resource_type){'EC2::Instance'}
    before do
      get :resource_properties, resource_type: resource_type
    end

    it 'should assign @properties' do
      props = klass.resource(resource_type).properties
      expect(assigns[:properties]).to eq props
    end
  end

  describe '#create' do
    skip
  end
end
