#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  class << self
    # 引数に渡したアクションは、master を持ったユーザーでのみ許可されるようになる。
    # @param [Array<Symbol>] actions
    def master(*actions)
      actions.each do |action|
        define_method(action){user.master?}
      end
    end

    # 引数に渡したアクションは、admin を持ったユーザーでのみ許可されるようになる。
    # @param [Array<Symbol>] actions
    def admin(*actions)
      actions.each do |action|
        define_method(action){user.admin?}
      end
    end

    # 引数に渡したアクションは、master と admin を両方持ったユーザーでのみ許可されるようになる。
    # @param [Array<Symbol>] actions
    def master_admin(*actions)
      actions.each do |action|
        define_method(action){user.master? and user.admin?}
      end
    end

    private :master, :admin, :master_admin
  end

  master :index?, :show?
  admin :create?, :new?, :update?, :edit?, :destroy?

  def scope
    Pundit.policy_scope!(user, record.class)
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope
    end
  end
end
