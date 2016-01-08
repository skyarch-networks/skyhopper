#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'json'

class JsonValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    JSON::parse(value)
  rescue JSON::ParserError => ex
    msg = ex.message
    record.errors[attribute] << msg
  end
end
