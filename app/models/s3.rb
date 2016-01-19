#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# XXX: キャッシュをしているため、変更が生じた場合はインスタンスを作りなおさなければならない。
#      もしくは、キャッシュをしている変数をクリアする。
#      @website
#      @web_conf_opt
class S3 < SimpleDelegator
  def initialize(infra, bucket_name)
    access_key_id     = infra.access_key
    secret_access_key = infra.secret_access_key
    @region            = infra.region

    @s3 = ::AWS::S3.new(
      access_key_id:     access_key_id,
      secret_access_key: secret_access_key,
    )

    @s3_bucket = @s3.buckets[bucket_name]
    __setobj__(@s3_bucket)
  end


  # 毎回APIを叩かせないためキャッシュ
  # TODO: websiteかどうかが変更された場合の処理
  def website?
    if @website.nil?
      return @website = @s3_bucket.website?
    else
      return @website
    end
  end

  def web_conf_opt
    @web_conf_opt ||= @s3_bucket.website_configuration.options
  end

  def owner
    @s3_bucket.owner[:display_name]
  end

  def index_document
    web_conf_opt[:index_document][:suffix] if self.website?
  end

  def error_document
    web_conf_opt[:error_document][:key] if self.website? and web_conf_opt[:error_document]
  end

  def public_url
    "http://#{self.name}.s3-website-#{@region}.amazonaws.com" if self.website?
  end
end
