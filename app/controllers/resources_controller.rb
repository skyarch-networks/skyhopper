#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ResourcesController < ApplicationController
  # TODO: auth

  # GET /resources
  # ==== params 
  # [infrastructure_id]
  def index
    infra_id = params.require(:infrastructure_id)
    infra = Infrastructure.find(infra_id)
    resources = infra.resources_or_create

    # TODO: format
    resp = {
      ec2_instances: resources.ec2,
      rds_instances: resources.rds,
      s3_buckets:    resources.s3,
    }

    render json: resp and return
  end
end
