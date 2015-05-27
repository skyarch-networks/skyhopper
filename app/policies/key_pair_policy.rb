class KeyPairPolicy < ApplicationPolicy

  %i[index? retrieve?].each do |action|
    define_method(action) do
      user.allow?(record)
    end
  end

  %i[destroy?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end
end
