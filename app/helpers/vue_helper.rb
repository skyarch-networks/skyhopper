#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module VueHelper
  def link_and_dropdown_ssh(value)
    <<-EOS.html_safe
<div v-if="#{value}" class="dropdown">
  <a target="_blank" :href="'//' + #{value}">#{value}</a>
  <a class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
    <span class="caret"></span>
  </a>
  <ul class="dropdown-menu">
    <li><a :href="'ssh://ec2-user@' + #{value}" target="_blank">ssh://ec2-user@{{#{value}}}</a></li>
    <li><a :href="'ssh://root@' + #{value}" target="_blank">ssh://root@{{#{value}}}</a></li>
  </ul>
</div>
    EOS
  end

  def copy_to_clipboard_button(value, possition=nil)
    <<-EOS.html_safe
<button :disabled="!#{value}" role="button" class="btn btn-xs btn-default #{possition}" data-clipboard :data-clipboard-text="#{value}" data-copied-hint="Copied!">
  <span class="glyphicon glyphicon-copy"></span>
  <span class="copied-hint-target">Copy</span>
</button>
    EOS
  end
end
