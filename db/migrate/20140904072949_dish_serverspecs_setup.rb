class DishServerspecsSetup < ActiveRecord::Migration[4.2]
  def up
    Dish.all.each do |dish|
      dish.serverspecs.each do |serverspec_id|
        DishServerspec.create(dish_id: dish.id, serverspec_id: serverspec_id)
      end
    end
  end
end
