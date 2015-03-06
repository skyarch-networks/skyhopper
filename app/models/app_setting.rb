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
    # XXX: 現状ではシングルトンだが、複数の設定を切り替えられるようにする?
    def get
      @@get ||= self.first
    end

    def set?
      self.count != 0 and not self.get.dummy?
    end

    # XXX: 遅そう
    def clear_dummy
      self.all.select(&:dummy?).each(&:destroy)
    end

    def clear_cache
      @@get = nil
    end

    def attrs
      @@attrs ||= self.column_names.reject{|x| ['created_at', 'updated_at', 'id'].include?(x)}.map(&:to_sym)
    end

    # setting is Symbol key Hash
    def validate(setting)
      [:chef_key, :log_directory].each do |col|
        begin
          val = setting.fetch(col)
        rescue KeyError
          next
        end
        raise ValidateError, "#{col} must be a pathname!" unless is_pathname?(val)
      end

      [:chef_url].each do |col|
        begin
          val = setting.fetch(col)
        rescue KeyError
          next
        end
        begin
          URI::parse(val)
        rescue URI::InvalidURIError
          raise ValidateError, "#{col} must be a url"
        end
      end

      begin
        val = setting.fetch(:aws_region)
      rescue KeyError
      else
        raise ValidateError, "aws_region must be an aws region" unless AWS::Regions.include?(val)
      end

      # TODO: chef_name

      return true
    end

    def is_pathname?(path)
      path =~ /^~?\//
    end
    private :is_pathname?
  end

  def dummy?
    attributes.any?{|key, val| val == DummyText}
  end
end
