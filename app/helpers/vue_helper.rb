#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module VueHelper
  def link_and_dropdown_ssh(value)
    content_tag(:div, class: 'dropdown', 'v-if': value.to_s) do
      contents = []
      contents << content_tag(
        :a,
        "{{#{value}}}",
        { target: '_blank', ':href': "'//' + #{value}" },
        false,
      )
      contents << content_tag(
        :a,
        class: 'dropdown-toggle',
        'data-toggle': 'dropdown',
        'aria-haspopup': 'true',
        'aria-expanded': 'true',
      ) do
        content_tag(:span, nil, class: 'caret')
      end
      contents << content_tag(
        :ul,
        class: 'dropdown-menu',
      ) do
        menu_contents = []
        menu_contents << content_tag(:li) do
          content_tag(
            :a,
            "ssh://ec2-user@{{#{value}}}",
            { ':href': "'ssh://ec2-user@' + #{value}", target: '_blank' },
            false,
          )
        end
        menu_contents << content_tag(:li) do
          content_tag(
            :a,
            "ssh://root@{{#{value}}}",
            { ':href': "'ssh://root@' + #{value}", target: '_blank' },
            false,
          )
        end
        safe_join(menu_contents)
      end
      safe_join(contents)
    end
  end

  def copy_to_clipboard_button(value, possition = nil)
    content_tag(
      :button,
      class: "btn btn-xs btn-default #{possition}",
      ':disabled': "!#{value}",
      role: 'button',
      'data-clipboard': true,
      ':data-clipboard-text': value.to_s,
      'data-copied-hint': 'Copied!',
    ) do
      safe_join([
                  content_tag(:span, nil, class: 'glyphicon glyphicon-copy'),
                  content_tag(:span, 'Copy', class: 'copied-hint-target'),
                ])
    end
  end
end
