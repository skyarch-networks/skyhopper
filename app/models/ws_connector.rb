#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class WSConnector
  using ErrorHandlize

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
    push(data.to_json)
  end

  def push_error(exception)
    push_as_json(error: exception.format_error)
  end
end
