json.array!(@dishes) do |dish|
  json.extract! dish, :id, :status, :name, :detail, :project_id, :runlist
  json.url dish_url(dish, format: :json)
end
