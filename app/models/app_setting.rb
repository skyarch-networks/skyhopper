#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'uri'

class AppSetting < ActiveRecord::Base
  belongs_to :ec2_private_key, dependent: :delete

  validates :log_directory, format: { with: %r{\A(~?/)} }
  validates :aws_region, inclusion: { in: AWS::Regions }

  class ValidateError < StandardError; end

  class << self
    # @return [AppSetting] 使用すべき設定を返す
    # XXX: 現状ではシングルトンだが、複数の設定を切り替えられるようにする?
    def get
      Rails.cache.fetch('app_setting') { first }
    end

    # @return [Boolean] セッティング済みかどうかを返す
    def set?
      count.nonzero? and !get.dummy?
    end

    # 全てのダミーセッティングを削除する
    # XXX: 遅そう
    def clear_dummy
      all.select(&:dummy?).each(&:destroy)
    end

    # AppSetting.get 用のキャッシュを削除する。
    # 設定を更新した場合などにする必要がある
    def clear_cache
      Rails.cache.delete('app_setting')
    end
  end
end
