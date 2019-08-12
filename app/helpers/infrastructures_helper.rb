#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module InfrastructuresHelper
  def edit_infra(infra, user: current_user)
    return nil unless Pundit.policy(user, infra).edit?

    editable = if infra.status.present?
                 nil
               else
                 edit_infrastructure_path(infra)
               end

    editable
  end

  def button_detach_stack(infra, user: current_user)
    return nil unless Pundit.policy(user, infra).destroy?

    if deleting?(infra.status)
      return nil
    end

    true
  end

  def button_delete_stack(infra, user: current_user)
    return nil unless Pundit.policy(user, infra).delete_stack?

    deletable = deleting?(infra.status) || infra.status.blank? ? nil : true
    deletable
  end

  def button_add_infra(project, user: current_user)
    return nil unless Pundit.policy(user, Infrastructure.new(project: project)).new?

    link_to t('infrastructures.btn.add'),
            new_infrastructure_path(project_id: project.id),
            class: 'btn btn-primary btn-sm'
  end

  def project_params_usage
    content_tag(:div, t('project_parameters.usage'), class: 'bs-callout bs-callout-info')
  end

  private

  def deleting?(status)
    return false unless status
    return false if status == 'DELETE_FAILED'

    status.include?('DELETE')
  end
end
