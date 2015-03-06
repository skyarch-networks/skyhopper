#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module CfTemplatesHelper
  def jsons_select(jsons)
    select_vals = jsons.map do |json|
      content_tag(:option, json.name, value: json.id, class: 'option-cf_templates')
    end
    select = content_tag(:select, select_vals.join("\n").html_safe, size: 20, class: 'jsonlist form-control')
    select_group = content_tag(:div, select, class: "form-group")

    button_val = content_tag(:span, '', class: 'glyphicon glyphicon-chevron-left')
    button     = content_tag(:button, button_val, class: 'btn btn-default getpastjson')
    button_group = content_tag(:div, button, class: "form-group")

    return select_group + button_group
  end
end
