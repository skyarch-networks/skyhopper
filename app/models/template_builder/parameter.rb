#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Parameter
  class InvalidDataType < StandardError; end

  def initialize(name, property)
    raise InvalidDataType unless property.can_parameterize?

    @type =
      if property.data_type == String
        'String'.freeze
      else # Array
        'CommaDelimitedList'.freeze
      end

    @name = name.to_sym
    @property = property
  end
  attr_reader :name

  # TODO: Type String以外
  def build
    param = {
      @name => {
        Type: @type,
      },
    }

    case @type
    when 'String'
      build_for_string(param)
    when 'CommaDelimitedList'
      build_for_array(param)
    end

    param
  end

  private

  def build_for_string(param)
    if @property.select?
      param[@name][:AllowedValues] = @property.get_options
    end

    return unless (validator = @property.data_validator)

    param[@name][:AllowedPattern] = validator[:regexp] if validator[:regexp]
    param[@name][:MaxLength] = validator[:max] if validator[:max]
    param[@name][:MinLength] = validator[:min] if validator[:min]
  end

  def build_for_array(_param); end
end
