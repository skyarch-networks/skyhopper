class ResourceStatusKindEnum < ActiveRecord::Migration
  StatusTable = {
    'Success'    => 0,
    'Failed'     => 1,
    'Pending'    => 2,
    'UnExecuted' => 3,
    'InProgress' => 4,
    nil          => 3,
  }

  KindTable = {
    'serverspec' => 0,
    'cook'       => 1,
    'yum'        => 2,
  }

  def up
    old = ResourceStatus.pluck(:value)
    remove_column :resource_statuses, :value
    add_column    :resource_statuses, :value, :integer
    ResourceStatus.all.each.with_index do |r, i|
      r[:value] = StatusTable[old[i]]
      r.save!
    end
    change_column :resource_statuses, :value, :integer, null: false

    old = ResourceStatus.pluck(:kind)
    remove_column :resource_statuses, :kind
    add_column    :resource_statuses, :kind, :integer
    ResourceStatus.all.each.with_index do |r, i|
      r[:kind] = KindTable[old[i]]
      r.save!
    end
    change_column :resource_statuses, :kind, :integer, null: false
  end
end
