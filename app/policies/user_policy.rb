class UserPolicy < ApplicationPolicy
  master :index?, :create?, :new?, :update?, :edit?, :destroy?, :sync_zabbix?
end
