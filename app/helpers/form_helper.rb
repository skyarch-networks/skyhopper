#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module FormHelper
  def parts_select(options: nil, selected_option: nil, klass: nil, attributes: nil)
    selected_empty_option = please_select_option(selected_option) if selected_option
    return <<-EOS.html_safe
<select class="form-control #{klass}" #{attributes}>
  #{selected_empty_option if selected_option}
  #{options}
</select>
    EOS
  end

  def parts_input(type: "text", klass: nil, placeholder: nil, attributes: nil)
    "<input type=\"#{type}\" class=\"form-control #{klass}\" #{"placeholder=\"#{placeholder}\"" if placeholder} #{attributes}>".html_safe
  end

  def parts_textarea(klass: nil, placeholder: nil, attributes: nil)
    placeholder =
      if placeholder
        "placeholder=\"#{placeholder}\""
      else
        nil
      end

    return <<-EOS.html_safe
<textarea class="form-control #{klass}" #{attributes} #{placeholder}><textarea>
    EOS
  end

  def please_select_option(msg = I18n.t('common.please_select'))
    %!<option value="" selected>#{msg}</option>!.html_safe
  end
end
