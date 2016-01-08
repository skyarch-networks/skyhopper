#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Output
  class BuildError < StandardError; end

  def initialize(name)
    @name = name
  end
  attr_reader :name

  def set(description: nil, value: nil)
    @description = description
    @value = value
  end

  def build
    raise BuildError, 'Description required.' unless @description
    raise BuildError, 'Value required.' unless @value

    return {
      @name => {
        Description: @description,
        Value:       @value,
      }
    }
  end
end
