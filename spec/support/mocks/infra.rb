#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module InfraStub
  def stubize_infra
    klass = Infrastructure

    before do
      allow_any_instance_of(klass).to receive(:detach_chef)
    end
  end
end
