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
    matchers: {
      be_readable: {
        parameters: [:name1, name2],
        chains:    [:name1, name2],
      },
    },
    its_targets: [:md5sum, ...],
  },
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
  # @return [Hash{Symbol => Hash}] {NAME: {parameters: [...], chains: [...]}}
  def matchers(resource_type)
    klass = Serverspec::Type.const_get(resource_type)
    ms = klass.instance_methods(false)

    res = {}

    # Ref: https://www.relishapp.com/rspec/rspec-expectations/docs/built-in-matchers/exist-matcher
    if ms.delete(:exists?)
      res[:exist] = {arguments: [], chains: []}
    end

    ms.select!{|m| m.to_s.end_with? '?'}

    ms.each do |name|
      res[to_be_style(name)] = matcher_detail(klass, name)
    end

    return res
  end

  # @param [Class] klass
  # @param [Symbol] matcher_name `hoge?` style name
  # @return [Hash{Symbol => Array}] {parameters: [...], chains: [...]}
  def matcher_detail(klass, matcher_name)
    method = klass.instance_method(matcher_name)
    params = method.parameters.map(&:last)
    # TODO: chains, もしチェインが存在すればparamsはemptyになるべき
    return {parameters: params, chains: []}
  end

  # hoge? => be_hoge
  # @param [Symbol] name
  def to_be_style(name)
    return :"be_#{name.to_s.chop}"
  end

  # @param [Symbol] resource_type
  # @return [Array<Symbol>]
  def its_targets(resource_type)
    klass = Serverspec::Type.const_get(resource_type)
    ms = klass.instance_methods(false)

    return ms
      .reject{|m| m.to_s.end_with?('?')}
      .select{|m| klass.instance_method(m).arity == 0}
      .map{|m| :":#{m}"}
  end
end

acl = ACL.new(%w[allow 127.0.0.1], ACL::DENY_ALLOW)

DRb.start_service(uri, ServerspecInfoRemote.new, tcp_acl: acl)
DRb.thread.join
