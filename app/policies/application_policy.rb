class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    read?
  end

  def show?
    scope.where(:id => record.id).exists?
  end

  def create?
    write?
  end

  def new?
    create?
  end

  def update?
    write?
  end

  def edit?
    update?
  end

  def destroy?
    write?
  end

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


  private

  def read?
    user.master?
  end

  def write?
    user.admin?
  end
end
