#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ResourcesController < ApplicationController
  # TODO: auth

  # GET /resources
  # @param [Integer] infra_id
  def index
    infra_id = params.require(:infra_id)
    infra = Infrastructure.find(infra_id)
    resources = infra.resources_or_create

    # TODO: format
    resp = {
      ec2_instances: resources.ec2,
      rds_instances: resources.rds,
      s3_buckets: resources.s3,
      elb_instances: resources.elb,
    }

    render json: resp and return
  end

  # POST /resources
  # @param [Integer] infra_id
  # @param [String] physical_id
  # @param [String] screen_name Optional
  def create
    infra_id    = params.require(:infra_id)
    physical_id = params.require(:physical_id)
    screen_name = params[:screen_name] || physical_id
    type_name   = 'AWS::EC2::Instance' # XXX: 決め打ち

    infra = Infrastructure.find(infra_id)
    unless infra.create_complete?
      render plain: I18n.t('resources.msg.infrastructure_not_created'), status: :bad_request
      return
    end

    # Infraが所属するRegionにphysical_idのインスタンスが存在しない場合
    unless infra.instance(physical_id).exists?
      render plain: I18n.t('resources.msg.cannot_find', physical_id: physical_id), status: :bad_request
      return
    end

    unless infra.instance(physical_id).describe_keypair == infra.keypairname
      render plain: I18n.t('resources.msg.keypair_dose_not_match', physical_id: physical_id), status: :bad_request
      return
    end

    unless infra.instance(physical_id).status != :terminated
      render plain: I18n.t('resources.msg.if_status_is_terminated', physical_id: physical_id), status: :bad_request
      return
    end

    begin
      instance = infra.instance(physical_id)
      instance.register_in_known_hosts

      Resource.create!(
        infrastructure_id: infra_id,
        physical_id: physical_id,
        screen_name: screen_name,
        type_name: type_name,
      )
    rescue StandardError => ex
      render plain: ex.message, status: :internal_server_error and return
    end

    render plain: I18n.t('resources.msg.created') and return
  end
end
