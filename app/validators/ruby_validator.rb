#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'ripper'

class RubyValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    begin
      RubyParser.parse(value)
    rescue => ex
      msg = "#{I18n.t('servertests.msg.parseerr')} (#{ex.message})"
      record.errors[attribute] << msg
    end
  end
end

class RubyParser < Ripper
  def on_parse_error(msg)
    raise msg
  end
end
