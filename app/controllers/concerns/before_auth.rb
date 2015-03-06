#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# before_action で使用する。
# ブロックの中で複数使用する場合、andでつなげる。但し or でつなげることはできない
# before_action do
#   master and admin
# end
module Concerns::BeforeAuth

  private

  # If current_user's role is not admin, redirect to the path
  def admin(path = root_path)
    unless current_user.admin?
      redirect_to path, alert: I18n.t('common.msg.no_permission') and return
    end
    true
  end

  # CRUD only by master user
  def master(path = root_path)
    unless current_user.master?
      redirect_to path, alert: I18n.t('common.msg.no_permission') and return
    end
    true
  end

  def allowed_project(project_id)
    return if current_user.master?

    project = Project.find(project_id)

    unless current_user.allow?(project)
      client_id = project.client_id
      redirect_to projects_url(client_id: client_id), alert: I18n.t('common.msg.no_permission') and return
    end
    true
  end

  def allowed_infrastructure(infra_id)
    return if current_user.master?

    infra = Infrastructure.find(infra_id)

    unless current_user.allow?(infra)
      #TODO: リダイレクト以外の方法を考える
      project_id = infra.project_id
      redirect_to infrastructures_url(project_id: project_id), alert: I18n.t('common.msg.no_permission') and return
    end
    true
  end
end
