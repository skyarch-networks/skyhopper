#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class WSConnector
  def initialize(kind, id)
    @kind = kind
    @id = id
    @endpoint = "#{kind}.#{id}"
    @redis = Redis.new
  end

  def push(data)
    @redis.publish(@endpoint, data)
  end

  def push_as_json(data)
    @redis.publish(@endpoint, data.to_json)
  end
end
