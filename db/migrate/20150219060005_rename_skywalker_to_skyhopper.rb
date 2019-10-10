class RenameSkywalkerToSkyhopper < ActiveRecord::Migration[4.2]
  def up
    client = Client.find_by(code: "Skywalker")
    if client.present?
      client.name = "SkyHopper"
      client.code = "SkyHopper"
      client.save!
    end
  end
end
