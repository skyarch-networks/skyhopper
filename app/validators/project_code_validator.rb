#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ProjectCodeValidator < ActiveModel::Validator
  def validate(record)
    code = record.code
    unless code.kind_of?(String)
      record.errors[:code] << "should be a String"
      return
    end

    if code == 'master'
      record.errors[:code] << "should not be 'master'"
      return
    end

    if code =~ /-read$/
      record.errors[:code] << "should not match /-read$/"
      return
    end

    if code =~ /-read-write$/
      record.errors[:code] << "should not match /-read-write$/"
      return
    end
  end
end
