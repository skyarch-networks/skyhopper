#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module VueHelper
  def link_and_dropdown_ssh(value)
    <<-EOS.html_safe
<div v-if="#{value}" class="dropdown">
  #{link_to "{{#{value}}}", "//{{#{value}}}", target: '_blank'}
  <a class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
    <span class="caret"></span>
  </a>
  <ul class="dropdown-menu">
    <li><a href="ssh://ec2-user@{{#{value}}}" target="_blank">ssh://ec2-user@{{#{value}}}</a></li>
    <li><a href="ssh://root@{{#{value}}}" target="_blank">ssh://root@{{#{value}}}</a></li>
  </ul>
</div>
    EOS
  end

  def copy_to_clipboard_button(value)
    <<-EOS.html_safe
<button v-attr="disabled: !#{value}" role="button" class="btn btn-xs btn-default zeroclipboard-button" data-copied-hint="Copied!" data-clipboard-text="{{#{value}}}">
  <span class="glyphicon glyphicon-copy"></span>
  <span class="copied-hint-target">Copy</span>
</button>
    EOS
  end
end
