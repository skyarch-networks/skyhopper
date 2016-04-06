#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module InfrastructuresHelper
  def edit_infra(infra, user: current_user)
    return nil unless Pundit.policy(user, infra).edit?

    if infra.status.present?
      return nil
    else
      return edit_infrastructure_path(infra)
    end

  end

  def button_detach_stack(infra, user: current_user)
    return false unless Pundit.policy(user, infra).destroy?
    return deleting?(infra.status) ? false : true
  end

  def button_delete_stack(infra, user: current_user)
    return false unless Pundit.policy(user, infra).delete_stack?
    return deleting?(infra.status) || infra.status.blank? ? false : true
  end

  def button_add_infra(project, user: current_user)
    return nil unless Pundit.policy(user, Infrastructure.new(project: project)).new?

    link_to t('infrastructures.btn.add'),
      new_infrastructure_path(project_id: project.id),
      class: 'btn btn-primary btn-sm'
  end

  def project_params_usage
    <<-EOS.html_safe
<div class="bs-callout bs-callout-info">
  #{t('project_parameters.usage')}
</div>
    EOS
  end


  private

  def deleting?(status)
    return false unless status
    return false if status == "DELETE_FAILED"

    status.include?("DELETE")
  end
end
