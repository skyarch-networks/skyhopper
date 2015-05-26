class DishPolicy < ApplicationPolicy
  %i[show? index? runlist?].each do |action|
    define_method(action) do
      return true unless record.project

      return user.allow?(record.project)
    end
  end


  %i[edit? update? new? create? destroy?].each do |action|
    define_method(action) do
      if record.project
        user.allow?(record.project) and user.admin?
      else
        user.admin?
      end
    end
  end
end
