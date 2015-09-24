#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Parameter
  class InvalidDataType < StandardError; end

  def initialize(name, property)
    raise InvalidDataType unless property.can_parameterize?

    if property.data_type == String
      @type = 'String'.freeze
    else # Array
      @type = 'CommaDelimitedList'.freeze
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


    return param
  end


  private

  def build_for_string(param)
    if @property.select?
      param[@name][:AllowedValues] = @property.get_options
    end

    if validator = @property.data_validator
      if reg = validator[:regexp]
        param[@name][:AllowedPattern] = reg
      end
      if max = validator[:max]
        param[@name][:MaxLength] = max
      end
      if min = validator[:min]
        param[@name][:MinLength] = min
      end
    end
  end

  def build_for_array(_param)

  end
end
