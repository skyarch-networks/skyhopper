#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module TemplateBuildersHelper
  def accordion_resource_properties(properties)
    accordion_name = 'resource_properies'

    content = properties.map do |property|
      accordion_group(property, accordion_name: accordion_name)
    end.join

    # TODO escapeをfalseにしているのが良くないので直す
    content_tag(:div, content, { id: accordion_name, class: 'panel-group' }, false)
  end

  private

  #### Accordion
  def accordion_group(property, accordion_name: nil)
    return nil unless accordion_name

    extra_klass =
      if property.required?
        'panel-danger'
      else
        'panel-default'
      end

    <<-TEMPLATE
    <div class="panel #{extra_klass}">
      #{accordion_heading(property, accordion_name: accordion_name)}
      #{accordion_body(property)}
    </div>
    TEMPLATE
  end

  #### Accordion Heading
  def accordion_heading(property, accordion_name: nil)
    return nil unless accordion_name

    <<-TEMPLATE
    <div class="panel-heading">
      <h4 class="panel-title">
        <a class=\"accordion-toggle property-heading\" data-toggle=\"collapse\" data-parent=\"##{accordion_name}\" href=\"#collapse-#{property.name}\" property-type=\"#{property.name}\">#{property.name}</a>
      </h4>
    </div>
    TEMPLATE
  end

  #### Parts of Accordion Body
  def accordion_body(property)
    <<-TEMPLATE
    <div id="collapse-#{property.name}" class="panel-collapse collapse">
      <div class="panel-body">
        #{checkbox_enable_property(property)}
        #{checkbox_is_parameter(property)}
        #{input_resource_property(property)}
      </div>
    </div>
    TEMPLATE
  end

  def checkbox_enable_property(property)
    return nil if property.required?

    "<div class=\"checkbox\"><label><input type=\"checkbox\" class=\"enable-property\" property-type=\"#{property.name}\">#{t('cf_templates.enable_property')}</label></div>"
  end

  def checkbox_is_parameter(property)
    return nil unless property.can_parameterize?

    disabled = property.required? ? '' : 'disabled'

    <<-TEMPLATE
    <div class="checkbox">
      <label>
        <input type="checkbox" class="is_parameter" property-type="#{property.name}" #{disabled}>
        #{t('cf_templates.parameterize')}
      </label>
    </div>
    TEMPLATE
  end

  def input_resource_property(property)
    common_attr = "property-type=\"#{property.name}\" #{property.required? ? 'required' : 'disabled'}"

    if property.select?
      return parts_select(
        options: options_for_select(property.get_options),
        selected_option: t('common.please_select'),
        klass: 'col-md-3 col-sm-3 property-value',
        attributes: common_attr,
      )
    end

    case property.data_type
    when :Boolean
      return <<-TEMPLATE
      <div class="radio">
        <label class="radio"><input type="radio" name="#{property.name}" class="property-value" value="enable" #{common_attr}>#{t('template_builder.enable')}</label>
      </div>
      <div class="radio">
        <label class="radio"><input type="radio" name="#{property.name}" class="property-value" value="disable" #{common_attr}>#{t('template_builder.disable')}</label>
      </div>
      TEMPLATE

    when Array
      return property_array(property)
    # when Hash
    #   # TODO
    when String
      return parts_input(
        klass: 'form-control input-sm property-value',
        attributes: common_attr,
        placeholder: validate_rule(property.data_validator),
      )
    end
  end

  def validate_rule(data_validator)
    rule = ''
    if data_validator.class == Hash
      rule << 'length: ' if data_validator[:min] || data_validator[:max]
      rule << data_validator[:min].to_s if data_validator[:min]
      rule << ' ~ ' if data_validator[:min] || data_validator[:max]
      rule << data_validator[:max].to_s if data_validator[:max]
      rule << ', pattern: ' + data_validator[:regexp].to_s if data_validator[:regexp]
    end

    rule
  end

  ## Nested Property
  def table_for_array(property_type, cols = ['values'])
    ths = ''
    cols.each do |col|
      ths << "<th>#{col}</th>"
    end
    <<-TEMPLATE
    <table class="table table-condensed" property-type="#{property_type}">
      <thead>
        #{ths}
        <th></th>
      </thead>
      <tbody>
      </tbody>
    </table>
    TEMPLATE
  end

  def form_array_items(property, hash_data_validator: nil)
    form_parts = ''
    common_attr = "property-type=\"#{property.name}\" array-item=\"true\" #{'disabled' unless property.required?}"

    if hash_data_validator
      hash_data_validator.each do |key, val|
        form_parts << "<div class=\"form-group\"><label>#{key}</label>"
        form_parts << parts_input(
          attributes: "#{common_attr} hash-key=\"#{val.name}\"",
          klass: 'input-sm',
        )
        form_parts << '</div>'
      end
    else
      form_parts << '<div class="form-group">' + parts_input(
        attributes: common_attr,
        klass: 'input-sm',
      ) + '</div>'
    end
    form_parts
  end

  # TODO: キレイにしたい, SELECT対応
  def property_array(property)
    table_cols = []

    hash_data_validator =
      if property.data_validator == String
        # StringのArray
        table_cols.push('values')
        nil
      else
        # HashのArray
        property.data_validator.data_validator.each do |key|
          table_cols.push(key)
        end
        property.data_validator.data_validator
      end

    form_parts = "<div>#{form_array_items(property, hash_data_validator: hash_data_validator)}</div>"
    form_parts << <<-TEMPLATE
    <button class="btn btn-default btn-sm add-array-item" property-type="#{property.name}" #{'disabled' unless property.required?}>
      <span class="glyphicon glyphicon-plus"></span>
    </button>
    TEMPLATE

    hidden = parts_input(
      type: 'hidden',
      klass: 'property-value',
      attributes: "property-type=\"#{property.name}\" data-type=\"array\"",
    )
    <<-TEMPLATE
    #{hidden}
    #{table_for_array(property.name, table_cols)}
    <div class="well">
      #{form_parts}
    </div>
    TEMPLATE
  end
end
