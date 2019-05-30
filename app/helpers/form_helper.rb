#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module FormHelper
  def parts_select(options: nil, selected_option: nil, klass: nil, attributes: nil)
    selected_empty_option = please_select_option(selected_option) if selected_option
    <<~TEMPLATE.html_safe
      <select class="form-control #{klass}" #{attributes}>
        #{selected_empty_option if selected_option}
        #{options}
      </select>
    TEMPLATE
  end

  def parts_input(type: 'text', klass: nil, placeholder: nil, attributes: nil)
    "<input type=\"#{type}\" class=\"form-control #{klass}\" #{"placeholder=\"#{placeholder}\"" if placeholder} #{attributes}>".html_safe
  end

  def please_select_option(msg = I18n.t('common.please_select'))
    content_tag(:option, msg, value: '', selected: true)
  end
end
