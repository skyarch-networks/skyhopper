class ClientPolicy < ApplicationPolicy
  master :index?, :show?, :create?, :new?

  %i[update? edit? destroy?].each do |action|
    define_method(action) do
      user.master? and not record.is_for_system?
    end
  end
end
