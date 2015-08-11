class SnapshotPolicy < ApplicationPolicy
  def index
    user.allow?(record)
  end

  %i[create? destroy? schedule?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end

end
