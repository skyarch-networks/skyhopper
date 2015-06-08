#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ClientsHelper
  def button_edit_client(client)
    return nil unless Pundit.policy(current_user, client).edit?

    link_to t('.edit', default: t("helpers.links.edit").html_safe),
      edit_client_path(client),
      class: 'btn btn-default btn-xs'
  end

  def button_delete_client(client)
    return nil unless Pundit.policy(current_user, client).destroy?

    link_to t('.destroy', default: t("helpers.links.destroy").html_safe),
      client_path(client),
      method: :delete,
      data:   { confirm: t('.confirm', default: t("helpers.links.confirm", default: 'Are you sure?')) },
      class:  'btn btn-xs btn-danger'
  end
end
