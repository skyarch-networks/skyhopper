class AddDatesToRecurringDates < ActiveRecord::Migration[4.2]
  def change
    add_column :recurring_dates, :dates, :text
  end
end
