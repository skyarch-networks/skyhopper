#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ChefServersController < ApplicationController
  before_action :authenticate_user!

  # GET /chef_servers/export_config
  def export_config
    prepare_chef_key_zip
    send_file(@zipfile.path, filename: 'chef_keys.zip')
    @zipfile.close
  end

  def locate_config
    infra = Project.for_chef_server.infrastructures.first
    stack = Stack.new(infra)
    physical_id = stack.instances.first.physical_resource_id

    path = Pathname.new(File.expand_path('~/.chef'))
    chef_server = ChefServer::Deployment.new(infra, physical_id)
    chef_server.init_knife_rb(path)

    ChefAPI.reload_config

    flash[:success] = t('chef_servers.msg.locate_config_done')
    redirect_to chef_servers_path
  end

  private
  def prepare_chef_key_zip
    @zipfile = Tempfile.open('chef')
    zf = ZipFileGenerator.new(File.expand_path('~/.chef'), @zipfile.path)
    zf.write
  end

end
