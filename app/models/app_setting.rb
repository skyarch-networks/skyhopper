#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'uri'

class AppSetting < ActiveRecord::Base
  belongs_to :ec2_private_key, dependent: :delete

  class ValidateError < StandardError; end

  class << self
    # @return [AppSetting] 使用すべき設定を返す
    # XXX: 現状ではシングルトンだが、複数の設定を切り替えられるようにする?
    def get
      Rails.cache.fetch('app_setting'){self.first}
    end

    # @return [Boolean] セッティング済みかどうかを返す
    def set?
      self.count != 0 and not self.get.dummy?
    end

    # 全てのダミーセッティングを削除する
    # XXX: 遅そう
    def clear_dummy
      self.all.select(&:dummy?).each(&:destroy)
    end

    # AppSetting.get 用のキャッシュを削除する。
    # 設定を更新した場合などにする必要がある
    def clear_cache
      Rails.cache.clear('app_setting')
    end

    # @param [Hash<Symbol => Any>] setting Validate する対象
    # @return [TrueClass]
    # @raise [ValidateError] バリデーションに失敗した場合に発生する
    def validate(setting)
      [:log_directory].each do |col|
        begin
          val = setting.fetch(col)
        rescue KeyError
          next
        end
        raise ValidateError, "#{col} must be a pathname!" unless is_pathname?(val)
      end

      begin
        val = setting.fetch(:aws_region)
      rescue KeyError
      else
        raise ValidateError, "aws_region must be an aws region" unless AWS::Regions.include?(val)
      end

      return true
    end

    # パスとして期待しているものかどうかを返す
    # @param [String] parh
    # @return [Boolean]
    def is_pathname?(path)
      path =~ /^~?\//
    end
    private :is_pathname?
  end

  # ダミー設定かどうかを返す
  # kind_of? で String のみを見ないと warning が出る(将来的にはエラー?) https://github.com/rails/rails/pull/18365
  # @return [Boolean]
  def dummy?
    attributes.any?{|key, val| val.kind_of?(String) && val == DummyText}
  end
end
