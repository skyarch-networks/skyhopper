#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

#= Instance variables
#== @name
# プロパティの名前を表します。CloudFormationのドキュメントと同じものを使用してください。
# 渡された値がSymbolに変換されます。
#
#== @required
# プロパティが必須かどうかを表します。
# デフォルトはfalseです。
#
#== @select
# 選択式のプロパティかどうかを表します。
# これを指定する場合には、プロパティに使用できるオプション一覧を返すブロックをinitializeメソッドに渡してください。
#
#== @data_type
# プロパティが許可する型を表します。
# ClassかSymbolかRegexpを渡します。
# Regexpの場合は、Stringかつその正規表現にマッチするものが正しいものとして扱われます。
#
#== @data_validator
# プロパティが許可する型の詳細なvalidatorを指定します。
#
#== @refs
# 参照先として有効なResourceのリスト。EC2::Instance のような形で指定する。
#
#= Instance Methods
#== #name, #data_type, #required?, #select?
# インスタンス変数へのアクセサです。
#
class TemplateBuilder::Property
  class SelectError < ::ArgumentError; end
  class InvalidValue < StandardError; end
  class InvalidDataType < ArgumentError; end

  @@data_types = [:Boolean, String, Hash, Array].freeze

  def initialize(name, data_type, data_validator: nil, required: false, select: false, refs: nil, &block)
    @name           = name.to_sym
    @data_type      = data_type
    @data_validator = data_validator
    @required       = !!required
    @select         = !!select

    if refs
      @refs = refs.is_a?(Array) ? refs : [refs]
      @refs.map!(&:to_sym)
    end

    valid_data_type_init

    return unless @select

    raise SelectError, 'Need receive block for get options' unless block

    @get_option_blk = block
  end

  # ----------------------------- attributes reader
  attr_reader :name, :data_type, :data_validator, :refs

  def required?
    @required
  end

  def select?
    @select
  end

  # プロパティのオプション一覧を返します。
  # select?がtrueの時にのみ使用できます。
  def get_options(*args)
    raise SelectError, "#{@name} isn't select property!" unless select?

    @get_option_blk.call(*args)
  end

  # valがプロパティの値として正しいものか検証します。
  def validate(val)
    validate_data_type(val)

    raise InvalidValue, "#{val} is invalid as #{name}" if select? && !get_options.include?(val)
  end

  # ネストしたプロパティが存在するものかどうかを返す。
  # TODO: Arrayの場合
  def exist_property?(hash)
    return false unless data_type == Hash
    raise ArgumentError unless hash.is_a?(Hash)

    hash.each do |key, val|
      begin
        v = data_validator.fetch(key)
      rescue KeyError
        return false
      end

      next unless val.is_a?(Hash)

      v.exist_property?(val)
    end

    true
  end

  # パラメータ化できるかどうかを返す
  def can_parameterize?
    data_type == String or (data_type == Array and data_validator == String)
  end

  private

  # initializer
  def valid_data_type_init
    raise InvalidDataType, "#{@data_type} isn't valid data_type" unless @@data_types.include?(@data_type)

    #---- @data_validator check
    return if @data_validator.nil?

    if @data_type == Array
      unless @data_validator == String or @data_validator.is_a?(self.class)
        raise InvalidDataType, "data_validator must be String or #{self.class} instance."
      end
    elsif @data_type == Hash
      unless @data_validator.is_a?(Hash)
        raise InvalidDataType, 'data_validator must be Hash instance.'
      end
    elsif @data_type == String
      unless @data_validator.is_a?(Hash)
        raise InvalidDataType, 'data_validator must be Hash instance.'
      end
    end
  end

  # validator
  def validate_data_type(val)
    case data_type
    when Symbol
      if data_type == :Boolean
        raise InvalidValue, "#{val} is not Boolean" unless [true, false].include?(val)
      end
    when Class
      raise InvalidValue, "#{val} class is #{val.class}. But #{name} needs #{data_type}!!" unless val.is_a?(data_type)

      return if @data_validator.nil?

      if data_type == String
        if (max = @data_validator[:max])
          raise InvalidValue, "#{val} is too long. max: #{max}" if val.size > max
        end

        if (min = @data_validator[:min])
          raise InvalidValue, "#{val} is too short. min: #{min}" if val.size < min
        end

        if (reg = @data_validator[:regexp])
          raise InvalidValue, "#{val} isn't #{reg}" unless val =~ reg
        end
      elsif data_type == Hash
        @data_validator.each do |key, prop|
          v = val[key]
          if v.nil? # key が存在しない
            raise InvalidValue, "#{key} is required." if prop.required?

            next
          end

          prop.validate(v)
        end
      elsif data_type == Array
        val.each do |v|
          if @data_validator == String
            raise "#{val} isn't #{@data_validator}" unless v.is_a?(@data_validator)
          else # @data_validator is Property instance
            @data_validator.validate(v)
          end
        end
      end
    end
  end
end
