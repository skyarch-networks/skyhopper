#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# TODO: test
module ServerspecInfo
  class << self
    delegate :resource_types, to: :remote

    def remote
      ::DRbObject.new_with_uri('druby://localhost:3100')
    end
  end
end
