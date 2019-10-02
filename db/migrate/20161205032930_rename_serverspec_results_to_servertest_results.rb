class RenameServerspecResultsToServertestResults < ActiveRecord::Migration[4.2]
  def change
    rename_table :serverspec_results, :servertest_results
  end
end
