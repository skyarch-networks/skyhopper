#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'yaml'

class YamlValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    YAML::safe_load(value)
  rescue Psych::SyntaxError => ex
    msg = ex.message
    record.errors[attribute] << msg
  end
end
