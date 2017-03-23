class OperationDurationPolicy < ApplicationPolicy
  %i[create? show? show_icalendar? upload_icalendar?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end
end
