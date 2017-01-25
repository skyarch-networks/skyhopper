#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ZabbixServerFqdnValidator < ActiveModel::Validator
  def validate(record)
    fqdn = record.fqdn
    if fqdn == 'master'
      record.errors[:fqdn] << "should not be 'master'"
      return
    end

    if fqdn =~ /-read$/
      record.errors[:fqdn] << "should not match /-read$/"
      return
    end

    if fqdn =~ /-read-write$/
      record.errors[:fqdn] << "should not match /-read-write$/"
      return
    end
  end
end
