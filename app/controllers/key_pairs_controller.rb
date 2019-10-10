#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class KeyPairsController < ApplicationController
  include Concerns::InfraLogger
  include ERB::Util
  # --------------- Auth
  before_action :authenticate_user!

  before_action :set_project

  before_action do
    def @project.policy_class
      KeyPairPolicy
    end
    authorize(@project)
  end

  # GET /key_pairs
  def index
    @allow_change = KeyPairPolicy.new(current_user, @project).destroy?
  end

  # GET /key_pairs/retrieve
  def retrieve
    @regions   = AWS::Regions
    @key_pairs = KeyPair.all(@project.id)
  end

  # DELETE /key_pairs/:fingerprint
  def destroy
    region     = params.require(:region)
    fingerprint = params.require(:fingerprint)

    @ec2 = Aws::EC2::Client.new(
      access_key_id: @project.access_key,
      secret_access_key: @project.secret_access_key,
      region: region,
    )
    check_fingerprint(fingerprint)

    @ec2.delete_key_pair(key_name: @key_name)

    ws_send(t('key_pairs.msg.deleted', name: ERB::Util.html_escape(@key_name)), true)
    render body: nil, status: :ok and return
  end

  private

  def set_project
    @project = Project.find(params.require(:project_id))
  end

  def check_fingerprint(fingerprint)
    keys = @ec2.describe_key_pairs
    keys[:key_pairs].each do |item|
      if item.key_fingerprint.eql? fingerprint
        @key_name = item.key_name
        break
      end
    end
  end
end
