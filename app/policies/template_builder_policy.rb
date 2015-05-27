class TemplateBuilderPolicy < ApplicationPolicy
  master_admin :new?, :resource_properties?, :create?
end
