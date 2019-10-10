require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module SkyHopper
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.1

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your application.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'
    config.time_zone = 'Tokyo'
    # config.active_record.default_timezone = :local
    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    config.i18n.default_locale = :ja
    config.i18n.available_locales = %i[en ja]
    I18n.enforce_available_locales = false

    config.generators do |g|
      g.test_framework :rspec,
                       fixtures: false,
                       fixture_replacement: :factory_girl

      g.fixture_replacement :factory_girl, dir: 'spec/factories'
    end

    # for i18n-js assets pipeline
    config.assets.paths << Rails.root.join('bundle', 'ruby', '*', 'gems', '*', 'vendor', 'assets', 'javascript').to_s

    config.session_store :redis_store, servers: ENV['REDIS_URL'] || 'redis://localhost:6379/1', expire_in: 60 * 30 * 24 * 30

    config.filter_parameters += %i[password apikey_secret]
    config.active_job.queue_adapter = :sidekiq

    # Version information
    config.my_version = 'Version 2.2.0'

    config.browserify_rails.paths << %r{frontend/}
  end
end

# To disable automatic retry
Sidekiq.configure_server do |config|
  config.server_middleware do |chain|
    chain.remove Sidekiq::JobRetry
  end
end

DUMMY_TEXT = 'This is dummy!'.freeze
