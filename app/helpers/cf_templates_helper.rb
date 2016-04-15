#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module CfTemplatesHelper
  def button_edit_cft(cft)
    return nil unless Pundit.policy(current_user, cft).edit?
    return edit_cf_template_path(cft)
  end

  def button_destroy_cft(cft)
    return nil unless Pundit.policy(current_user, cft).destroy?
    return cf_template_path(cft)
  end

  def button_add_cft
    return nil unless Pundit.policy(current_user, CfTemplate).new?

    return link_to(
      t('.new', default: t('cf_templates.btn.add')),
      new_cf_template_path,
      class: 'btn btn-primary btn-sm'
    )
  end

  def button_template_builder
    return nil unless Pundit.policy(current_user, TemplateBuilder).new?

    return link_to(
      t('template_builder.template_builder'),
      new_template_builder_path,
      class: 'btn btn-primary btn-sm'
    )
  end
end
