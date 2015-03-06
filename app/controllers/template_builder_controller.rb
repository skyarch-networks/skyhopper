#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilderController < ApplicationController

# --------------- auth
  before_action :authenticate_user!

  include Concerns::BeforeAuth

# global
  before_action do
    master and admin
  end


  # GET /template_builder/new
  def new
    @resources = TemplateBuilder.resources
  end

  # GET /template_builder/resource_properties
  def resource_properties
    resource_type = params.require(:resource_type)

    resource = TemplateBuilder.resource(resource_type)

    @properties = resource.properties

    render partial: 'resource_properties'
  end

  # POST /template_builder
  def create
    resources  = JSON::parse(params.require(:resources), symbolize_names: true)
    parameters = JSON::parse(params.require(:parameters), symbolize_names: true)

    template_builder = TemplateBuilder.new

    resources.each do |resource_name, resource_summary|
      resource_class = TemplateBuilder.resource(resource_summary[:resource_type])

      resource = resource_class.new(resource_name)
      resource.set_properties(resource_summary)

      if parameters[resource_name]
        hash = parameters[resource_name].inject({}){|h, name| h[name.to_sym] = nil;h}
        resource.set_refs_params(hash)
      end

      template_builder.add(resource)

      resource.param_properties.each do |prop|
        param = TemplateBuilder::Parameter.new("#{resource_name}#{prop.name}", prop)
        template_builder.add_param(param)
      end
    end

    @cf_template = CfTemplate.new(
      infrastructure_id: nil,
      name:              params.require(:subject),
      detail:            params[:detail],
      value:             template_builder.to_pretty_json,
      user_id:           current_user.id
    )

    if @cf_template.save
      render text: I18n.t('cf_templates.msg.created')
    else
      if @cf_template.errors[:json]
        render text: @cf_template.errors[:json], status: 500
      else
        #TODO: error message
        render text: "", status: 500
      end
    end
  end

end
