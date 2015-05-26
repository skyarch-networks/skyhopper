class InfrastructurePolicy < ApplicationPolicy

  %i[index? show? stack_events? show_rds? show_s3? show_elb?].each do |action|
    define_method(action) do
      user.allow?(record)
    end
  end

  %i[new? edit? create? update? destroy? delete_stack? change_rds_scale?].each do |action|
    define_method(action) do
      user.admin? and user.allow?(record)
    end
  end
end
