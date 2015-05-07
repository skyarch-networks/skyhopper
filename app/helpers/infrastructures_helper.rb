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
      :class               => "btn btn-xs btn-info show-infra",
      :"infrastructure-id" => infra.id
    }
  end

  def button_serverspecs(infra_id)
    return link_to t('serverspecs.serverspecs'), serverspecs_path(infrastructure_id: infra_id), class: 'btn btn-default btn-xs'
  end

  def button_detach_stack(infra = nil)
    if !infra || deleting?(infra.status)
      return link_to t('helpers.links.detach'), "#", class: "btn btn-xs btn-warning disabled"
    end

    return link_to t('helpers.links.detach'), '#', {
      class: 'btn btn-xs btn-warning detach-infra',
      :'infrastructure-id' => infra.id
    }
  end

  def button_delete_stack(infra = nil)
    btn_text = t('infrastructures.btn.delete_stack') + '&nbsp;' + content_tag(:span, '', class: 'caret')

    if !infra || deleting?(infra.status) || infra.status.blank?
      return link_to btn_text.html_safe, "#", class: "btn btn-xs btn-danger disabled"
    end

    button = link_to t('infrastructures.btn.delete_stack_confirm'), '#', {
      :class               => "delete-stack",
      :"infrastructure-id" => infra.id
    }
    ret = <<-EOF.html_safe
<div class="btn-group">
  <a class="btn btn-xs btn-danger dropdown-toggle" data-toggle="dropdown" href="#">
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

  def button_add_infra(client = nil, project = nil)
    return nil unless client && project
    return nil if client.is_for_system?

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
