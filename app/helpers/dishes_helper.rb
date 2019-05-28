#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module DishesHelper
  def label_dish_status(dish = nil)
    return false unless dish

    screen_status = dish.status || 'NOT YET'

    extra_class = case dish.status

                  when Dish::STATUS[:success]
                    'label-success'

                  when Dish::STATUS[:failure]
                    'label-danger'

                  when Dish::STATUS[:creating], Dish::STATUS[:bootstrapping], Dish::STATUS[:applying], Dish::STATUS[:serverspec]
                    'label-info'

                  else
                    'label-warning'

                  end

    content_tag(:span, screen_status, class: "label #{extra_class}")
  end

  def progressbar_dish_status(dish = nil)
    return false unless dish

    screen_status = dish.status || 'NOT YET'
    progress = '100'
    extra_class = 'progress-bar-info progress-bar-striped active'

    case dish.status

    when Dish::STATUS[:success]
      extra_class = 'progress-success'

    when Dish::STATUS[:failure]
      extra_class = 'progress-danger'

    when Dish::STATUS[:creating]
      progress = '20'

    when Dish::STATUS[:bootstrapping]
      progress = '40'

    when Dish::STATUS[:applying]
      progress = '60'

    when Dish::STATUS[:serverspec]
      progress = '80'

    else
      progress = '0'

    end

    content_tag(:div, nil, class: 'progress validating-dish', style: 'margin-bottom: 0px;') do
      content_tag(
        :div,
        screen_status,
        class: "progress-bar #{extra_class}",
        style: "width: #{progress}%;",
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': progress,
      )
    end
  end
end
