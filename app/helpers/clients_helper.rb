#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ClientsHelper
  def edit_client_path_url(client)
    return nil unless Pundit.policy(current_user, client).edit?

    edit_client_path(client)
  end

  def delete_client_path(client)
    return nil unless Pundit.policy(current_user, client).destroy?

    client_path(client)
  end
end
