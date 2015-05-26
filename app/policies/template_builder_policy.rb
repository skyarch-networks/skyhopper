class TemplateBuilderPolicy < ApplicationPolicy
  %i[new? resource_properties? create?].each do |action|
    define_method(action) do
      user.master and user.admin
    end
  end
end
