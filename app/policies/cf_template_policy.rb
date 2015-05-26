class CfTemplatePolicy < ApplicationPolicy
  %i[edit? update? destroy?].each do |action|
    define_method(action) do
      if infra = record.infrastructure
        user.allow?(infra)
      else
        user.master and user.admin
      end
    end
  end

  %i[new_for_creating_stack? insert_cf_params? create_and_send? history? show?].each do |action|
    define_method(action) do
      if infra = record.infrastructure
        user.allow?(infra)
      else
        true
      end
    end
  end

  master_admin :new?, :create?
end
