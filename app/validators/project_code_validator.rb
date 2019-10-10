#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ProjectCodeValidator < ActiveModel::Validator
  def validate(record)
    code = record.code
    if code == 'master'
      record.errors[:code] << "should not be 'master'"
      return
    end

    if /-read$/.match?(code)
      record.errors[:code] << 'should not match /-read$/'
      return
    end

    return unless /-read-write$/.match?(code)

    record.errors[:code] << 'should not match /-read-write$/'
    nil
  end
end
