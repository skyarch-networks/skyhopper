#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'set'

# このクラスは各Resourceで継承する。
# このクラスのインスタンスは作成しないこと。
class TemplateBuilder::Resource
  class InvalidPropertyError < StandardError; end
  class BuildError < StandardError; end

  class << self
    def resource_type
      self.to_s.sub(/^TemplateBuilder::Resource::/, '').freeze
    end

    def duped_resource_base
      Marshal.load(Marshal.dump(self.class_variable_get(:@@resource_base)))
    end

    # 継承元のクラスで、@@propertiesを宣言する。
    # TemplateBuilder::Propertyの配列。
    # 使用できるプロパティを返す。
    # return TemplateBuilder::Property Array
    def properties
      return self.class_variable_get(:@@properties)
    end

    # 継承された時
    def inherited(klass)
      klass.const_set(:Type, "AWS::#{klass.resource_type}".freeze)
      klass.class_variable_set(:@@resource_base, {Type: klass.const_get(:Type), Properties: {}}.recursive_freeze)
    end

    def required_properties
      properties.select{|prop| prop.required?}
    end
  end

  def initialize(name)
    @name = name
    @properties = {}
    @param_properties = Set.new
  end
  attr_reader :name
  attr_reader :param_properties

  # @propertiesに値をセットする。
  # 引数は、{prop_name: prop_value, ...}の形式。
  def set_properties(hash)
    each_exist_props(hash) do |prop, val|
      prop.validate(val)
      @properties[prop.name] = val
    end
    self
  end

  # @properties にRefをセットする。
  # 引数は、{prop_name: ref_key, ...}の形式
  # ref_keyがnilならば、ResourceNamePropertyNameなものをセットする。
  def set_refs_params(hash)
    props = {}
    each_exist_props(hash) do |prop, val|
      if val.nil?
        props[prop.name] = "#{@name}#{prop.name}"
      else
        props[prop.name] = val
      end

      @param_properties.add(prop)
    end

    set_refs(props)
  end

  # @properties にRefをセットする。
  # 引数は、{prop_name: ref_key, ...}の形式
  # ref_keyは必須。
  def set_refs(hash)
    each_exist_props(hash) do |prop, val|
      raise InvalidPropertyError, "Ref-key must be not nil." if val.nil?

      @properties[prop.name] = {Ref: val}
    end

    self
  end

  def resource_type
    self.class.resource_type
  end

  def build
    self.class.required_properties.each do |prop|
      raise BuildError, "#{prop.name} is required." unless @properties.has_key?(prop.name)
    end

    result = {
      @name => self.class.duped_resource_base.deep_merge(
        Properties: @properties
      )
    }
    return result
  end

  private

  # each_exist_props(hash){|prop, val|}
  def each_exist_props(prop, &blk)
    properties = self.class.properties
    properties.each do |valid_prop|
      begin
        val = prop.fetch(valid_prop.name)
      rescue KeyError
        next
      end

      blk.call(valid_prop, val)
    end
  end
end
