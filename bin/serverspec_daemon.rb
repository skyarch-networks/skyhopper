#!/usr/bin/env ruby

require 'active_support'
require 'active_support/core_ext'
require 'serverspec'
require 'json'
require 'drb/drb'
require 'drb/acl'

uri = 'druby://localhost:3100'

class ServerspecInfoRemote
=begin
{
  RESOURCE_TYPE: {
    matchers: [:be_readable, ...]
    },
    its_targets: [:md5sum, ...]
  },
  _: {
    ...
  }
}
=end
  def get
    types = resource_types
    res = {}

    types.each do |t|
      snaked_t = t.to_s.underscore.to_sym

      res[snaked_t] = {}
      res[snaked_t][:matchers] = matchers(t)
      res[snaked_t][:its_targets] = its_targets(t)
    end

    return res
  end

  private
  # @return [Array<Symbol>]
  def resource_types
    t = Serverspec::Type.constants
    t.delete(:Base)
    return t
  end

  # @param [Symbol] resource_type
  # @return [Array<Symbol>]
  def matchers(resource_type)
    klass = Serverspec::Type.const_get(resource_type)
    ms = klass.instance_methods(false)

    res = []

    # Ref: https://www.relishapp.com/rspec/rspec-expectations/docs/built-in-matchers/exist-matcher
    if ms.delete(:exists?)
      res.push(:exist)
    end

    # TODO: get parameter infomation, chain infomation...
    return res.concat(ms.map(&:to_s).select{|m|m.end_with?('?')}.map{|m| :"be_#{m.chop}"})
  end


  # @param [Symbol] resource_type
  # @return [Array<Symbol>]
  def its_targets(resource_type)
    klass = Serverspec::Type.const_get(resource_type)
    ms = klass.instance_methods(false)

    return ms
      .reject{|m| m.to_s.end_with?('?')}
      .select{|m| klass.instance_method(m).parameters.empty?}
  end
end

acl = ACL.new(%w[allow 127.0.0.1], ACL::DENY_ALLOW)

DRb.start_service(uri, ServerspecInfoRemote.new, tcp_acl: acl)
DRb.thread.join
