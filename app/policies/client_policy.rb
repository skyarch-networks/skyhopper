class ClientPolicy < ApplicationPolicy
  master :index?, :show?, :create?, :new?, :update?, :edit?, :destroy?
end
