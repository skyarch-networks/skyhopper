class ProjectPolicy < ApplicationPolicy
  # TODO: Project のインスタンスへの権限が与えられている場合はどうする?
  admin :edit?, :update?
  master_admin :new?, :create?
  def index?;true end

  def destroy?
    user.admin? and not record.client.is_for_system?
  end
end
