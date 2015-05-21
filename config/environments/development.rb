SkyHopper::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports and disable caching.
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise an error on page load if there are pending migrations
  config.active_record.migration_error = :page_load

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  BetterErrors::Middleware.allow_ip! '172.16.0.0/16'

  # for bullet
  config.after_initialize do
    Bullet.enable        = true # Bulletプラグインを有効
    Bullet.alert         = true # JavaScriptでの通知
    Bullet.bullet_logger = true # log/bullet.logへの出力
    Bullet.console       = true # ブラウザのコンソールログに記録
    Bullet.rails_logger  = true # Railsログに出力

    Bullet.add_whitelist type: :n_plus_one_query, class_name: "Infrastructure", association: :ec2_private_key
    Bullet.add_whitelist type: :unused_eager_loading, class_name: 'Infrastructure', association: :ec2_private_key
  end

  config.logger = Logger.new('log/development.log', 5, 10.megabyte)
end
