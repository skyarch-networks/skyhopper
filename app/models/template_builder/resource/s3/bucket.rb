#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class TemplateBuilder::Resource::S3::Bucket < TemplateBuilder::Resource
  @@properties = [
    TemplateBuilder::Property.new(:AccessControl, String, select: true){access_controls},
    TemplateBuilder::Property.new(:BucketName, String),
  ].freeze

  class << self
    def access_controls
      ['Private', 'PublicRead', 'PublicReadWrite', 'AuthenticatedRead', 'LogDeliveryWrite', 'BucketOwnerRead', 'BucketOwnerFullControl']
    end
  end
end
