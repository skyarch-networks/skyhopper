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

  private
  def prepare_chef_key_zip
    @zipfile = Tempfile.open('chef')
    zf = ZipFileGenerator.new(File.expand_path('~/.chef'), @zipfile.path)
    zf.write
  end

end
