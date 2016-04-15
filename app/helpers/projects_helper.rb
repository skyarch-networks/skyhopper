#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ProjectsHelper
  def delete_project_url(project)
    return nil unless Pundit.policy(current_user, project).destroy?
    return project_path(project)
  end

  def project_settings(project)
    return {dishes_path:  dishes_path(project_id: project.id),
      key_pairs_path: key_pairs_path(project_id: project.id),
      project_parameters_path: project_parameters_path(project_id: project.id),
      }
  end

  def button_add_project(client)
    return nil unless client
    return nil unless Pundit.policy(current_user, Project.new(client: client)).new?

    link_to t('projects.btn.add'),
      new_project_path(client_id: client.id),
      class: 'btn btn-primary btn-sm'
  end
end
