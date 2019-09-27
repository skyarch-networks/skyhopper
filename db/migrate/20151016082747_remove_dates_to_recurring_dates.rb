class RemoveDatesToRecurringDates < ActiveRecord::Migration[4.2]
  def change
    remove_column :recurring_dates, :dates, :string
  end
end
