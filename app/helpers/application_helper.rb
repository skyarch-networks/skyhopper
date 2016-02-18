#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ApplicationHelper

  def full_title(page_title)
    base_title = "SkyHopper"  # to set up their own application name
    if page_title.empty?
      base_title
    else
      "#{base_title} | #{page_title} "
    end
  end

  def gravatar(email)
    require 'digest/md5'
    email_address = email.downcase
    hash = Digest::MD5.hexdigest(email_address)
    image_src = "https://secure.gravatar.com/avatar/#{hash}"

    return image_tag(image_src, size: "24x24", class: "img-rounded gravatar-icon")
  end


  def bootstrap_flash(options = {})
    flash_messages = []
    flash.each do |type, message|
      # Skip empty messages, e.g. for devise messages set to nothing in a locale file.
      next if message.blank?

      type = type.to_sym
      type = :success if type.to_s == :notice.to_s
      type = :danger if type.to_s == :alert.to_s

      Array(message).each do |msg|
        text = content_tag(:div,
          content_tag(:button, raw("&times;"), :class => "close", "data-dismiss" => "alert") + msg,
          class: "alert fade in alert-#{type} alert-dismissible #{options[:class]}"
        )
        flash_messages << text if msg
      end
    end
    flash_messages.join("\n").html_safe
  end


  def breadcrumbs(client = nil, project = nil, infrastructure = nil)
    breadcrumb = '<ul class="breadcrumb">'

    breadcrumb <<
      if client
        <<-EOF
<li><a href="#{clients_path}">#{client.name} (#{client.code})</a></li>
        EOF
      else
        <<-EOF
<li><a href="#{clients_path}">#{I18n.t("clients.client")}</a></li>
        EOF
      end

    if project
      breadcrumb << <<-EOF
<li><a href="#{projects_path(client_id: client.id)}">#{project.name} (#{project.code})</a></li>
      EOF
    elsif client
      breadcrumb << <<-EOF
<li class="active">#{I18n.t("projects.project")}</li>
      EOF
    end

    if infrastructure
      breadcrumb << <<-EOF
<li class="active">#{infrastructure.stack_name}</li>
      EOF
    elsif project
      breadcrumb << <<-EOF
<li class="active">#{I18n.t("infrastructures.infrastructure")}</li>
      EOF
    end

    breadcrumb << '</ul>'

    return breadcrumb.html_safe
  end

  def loading_with_message(message = nil)
    loading_tag = "<div class=\"loader\"></div>".html_safe

    loading_tag <<
      if message
        " #{message}"
      else
        t('common.msg.loading')
      end

    return loading_tag
  end

  def uneditable_input(content)
    return "<span class=\"input-large uneditable-input form-control\" readonly>#{content}</span>".html_safe
  end

  def admin_label
    return "<span class=\"label label-info\">admin</span>".html_safe
  end

  def master_label
    return "<span class=\"label label-warning\">master</span>".html_safe
  end

  def add_option_path(path, options)
    options_str = options.map{|key, val| "#{key}=#{val}"}.join('&')
    return "#{path}?#{options_str}"
  end

  def glyphicon(name = nil)
    return false unless name
    return "<span class=\"glyphicon glyphicon-#{name}\"></span>".html_safe
  end

  def fa(name = nil)
    return false unless name
    return "<span class=\"fa fa-#{name}\"></span>".html_safe
  end
end
