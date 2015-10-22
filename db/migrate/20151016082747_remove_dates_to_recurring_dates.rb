class RemoveDatesToRecurringDates < ActiveRecord::Migration
  def change
    remove_column :recurring_dates, :dates, :string
  end
end
