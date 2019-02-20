json.array!(@dishes) do |dish|

  allow_change = @project_id ? current_user.admin? : current_user.master? && current_user.admin?

  next unless allow_change or dish.status == Dish::STATUS[:success]

    json.id dish.id
    json.status label_dish_status(dish)
    json.dish_name dish.name
    json.detail dish.detail
    json.project_id dish.project_id

    if allow_change
      json.dish_path dish_path(dish)
    end

  json.url dish_url(dish, format: :json)
end
