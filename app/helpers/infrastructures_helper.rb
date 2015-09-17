#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module InfrastructuresHelper
  def button_show_infra(infra)
    return link_to t("helpers.links.show"), "#", {
      class: "btn btn-xs btn-info show-infra",
      "infrastructure-id": infra.id,
    }
  end

  def button_serverspecs(infra_id)
    return link_to t('serverspecs.serverspecs'), serverspecs_path(infrastructure_id: infra_id), class: 'btn btn-default btn-xs'
  end

  def button_edit_infra(infra, user: current_user)
    return nil unless Pundit.policy(user, infra).edit?

    klass = 'btn btn-default btn-xs'
    kid = 'edit-'+infra.id.to_s
    if infra.status.present?
      path = '#'
      klass << ' disabled'
    else
      path = edit_infrastructure_path(infra)
    end

    return link_to(
      t('.edit', default: t("helpers.links.edit")),
      path,
      class: klass,
      id: kid,
    )
  end

  def button_detach_stack(infra, user: current_user)
    return nil unless Pundit.policy(user, infra).destroy?

    if deleting?(infra.status)
      return link_to t('helpers.links.detach'), "#", class: "btn btn-xs btn-warning disabled"
    end
    return link_to t('helpers.links.detach'), '#', {
      class:               'btn btn-xs btn-warning detach-infra',
      'infrastructure-id': infra.id,
    }
  end

  def button_delete_stack(infra, user: current_user)
    return nil unless Pundit.policy(user, infra).delete_stack?
    kid = "delete-"+infra.id.to_s
    btn_text = t('infrastructures.btn.delete_stack') + '&nbsp;' + content_tag(:span, '', class: 'caret')

    if deleting?(infra.status) || infra.status.blank?
      return link_to btn_text.html_safe, "#", class: "btn btn-xs btn-danger disabled", id: kid
    end

    button = link_to t('infrastructures.btn.delete_stack_confirm'), '#', {
      class:               "delete-stack",
      "infrastructure-id": infra.id,
    }
    ret = <<-EOF.html_safe
    <div class="btn-group">
      <a id="#{kid}" class="btn btn-xs btn-danger dropdown-toggle" data-toggle="dropdown" href="#">
        #{btn_text}
      </a>
      <ul class="dropdown-menu">
        <li>
          #{button}
        </li>
      </ul>
    </div>
    EOF
    return ret
  end

  def button_add_infra(project, user: current_user)
    return nil unless Pundit.policy(user, Infrastructure.new(project: project)).new?

    link_to t('infrastructures.btn.add'),
      new_infrastructure_path(project_id: project.id),
      class: 'btn btn-primary btn-sm'
  end


  private

  def deleting?(status)
    return false unless status
    return false if status == "DELETE_FAILED"

    status.include?("DELETE")
  end
end
