#!/usr/bin/env ruby

require 'serverspec'
require 'json'
require 'drb/drb'
require 'drb/acl'

uri = 'druby://localhost:3100'

class ServerspecInfoRemote
  def resource_types
    t = Serverspec::Type.constants
    t.delete(:Base)
    return t.map(&:to_s)
  end
end

acl = ACL.new(%w[allow 127.0.0.1], ACL::DENY_ALLOW)

DRb.start_service(uri, ServerspecInfoRemote.new, tcp_acl: acl)
DRb.thread.join
