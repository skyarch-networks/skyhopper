#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ProjectsHelper
  def button_delete_project(project)
    return nil unless Pundit.policy(current_user, project).destroy?

    link_to t('.destroy', default: t("helpers.links.destroy").html_safe),
      project_path(project),
      method: :delete,
      data:   { confirm: t('.confirm', default: t("helpers.links.confirm", default: 'Are you sure?')) },
      class:  'btn btn-xs btn-danger'
  end

  def button_add_project(client)
    return nil unless client
    return nil unless Pundit.policy(current_user, Project.new(client: client)).new?

    link_to t('projects.btn.add'),
      new_project_path(client_id: client.id),
      class: 'btn btn-primary btn-sm'
  end
end
