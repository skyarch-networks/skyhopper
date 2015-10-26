class AddDatesToRecurringDates < ActiveRecord::Migration
  def change
    add_column :recurring_dates, :dates, :text
  end
end
