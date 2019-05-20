#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module ApplicationHelper
  def full_title(page_title)
    base_title = 'SkyHopper' # to set up their own application name
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

    image_tag(image_src, size: '24x24', class: 'img-rounded gravatar-icon')
  end

  def bootstrap_flash(options = {})
    flash_messages = []
    if Rails.cache.exist?(:err)
      flash[:danger] = Rails.cache.read(:err)
      Rails.cache.delete(:err)
    end
    flash.each do |type, message|
      # Skip empty messages, e.g. for devise messages set to nothing in a locale file.
      next if message.blank?

      type = type.to_sym
      type = :success if type.to_s == :notice.to_s
      type = :danger if type.to_s == :alert.to_s

      Array(message).each do |msg|
        text = content_tag(:div,
                           content_tag(:button, raw('&times;'), :class => 'close', 'data-dismiss' => 'alert') + msg,
                           class: "alert fade in alert-#{type} alert-dismissible #{options[:class]}",)
        flash_messages << text if msg
      end
    end
    flash_messages.join("\n").html_safe
  end

  def breadcrumbs(client = nil, project = nil, infrastructure = nil)
    content_tag(:ul, nil, class: 'breadcrumb') do
      breadcrumb = []

      breadcrumb << if client
                      content_tag(:li, nil) do
                        content_tag(:a, "#{client.name} (#{client.code})", href: clients_path)
                      end
                    else
                      content_tag(:li, nil) do
                        content_tag(:a, I18n.t('clients.client').to_s, href: clients_path)
                      end
                    end

      breadcrumb << if project
                      content_tag(:li, nil) do
                        content_tag(:a, "#{project.name} (#{project.code})", href: projects_path(client_id: client.id))
                      end
                    elsif client
                      content_tag(:li, I18n.t('projects.project'), class: 'active')
                    end

      breadcrumb << if infrastructure
                      content_tag(:li, infrastructure.stack_name, class: 'active')
                    elsif project
                      content_tag(:li, I18n.t('infrastructures.infrastructure'), class: 'active')
                    end

      safe_join(breadcrumb)
    end
  end

  def loading_with_message(message = nil)
    loading_tag = content_tag(:div, nil, class: 'loader')

    loading_tag <<
      if message
        " #{message}"
      else
        t('common.msg.loading')
      end

    loading_tag
  end

  def uneditable_input(content)
    content_tag(:span, content.to_s, class: 'input-large uneditable-input form-control', readonly: true)
  end

  def admin_label
    content_tag(:span, 'admin', class: 'label label-info')
  end

  def master_label
    content_tag(:span, 'master', class: 'label-warning')
  end

  def add_option_path(path, options)
    options_str = options.map { |key, val| "#{key}=#{val}" }.join('&')
    "#{path}?#{options_str}"
  end

  def glyphicon(name = nil)
    return false unless name

    content_tag(:span, nil, class: "glyphicon glyphicon-#{name}")
  end

  def fa(name = nil)
    return false unless name

    content_tag(:span, nil, class: "fa fa-#{name}")
  end
end
