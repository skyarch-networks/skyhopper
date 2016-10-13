require File.expand_path('../boot', __FILE__)

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(:default, Rails.env)



module SkyHopper
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'
    config.time_zone = 'Tokyo'
    # config.active_record.default_timezone = :local
    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    config.i18n.default_locale = :en
    config.i18n.available_locales = [:en, :ja]
    I18n.enforce_available_locales = false

    config.generators do |g|
      g.test_framework :rspec,
        fixtures: false,
        fixture_replacement: :factory_girl

      g.fixture_replacement :factory_girl, dir: "spec/factories"
    end

    # XXX: disabling SSL verify to connect chef-server (it has no valid SSL certificate)
    stderr_back = $stderr.dup
    $stderr.reopen('/dev/null')
    OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE
    $stderr.flush
    $stderr.reopen stderr_back

    # for i18n-js assets pipeline
    config.assets.paths << "#{Rails.root}/bundle/ruby/*/gems/*/vendor/assets/javascript"
    config.assets.paths << "#{Rails.root}/frontend/dest"

    config.session_store :redis_store, servers: 'redis://localhost:6379/1', expire_in: 60 * 30 * 24 * 30

    config.filter_parameters += [:password, :apikey_secret]
    config.active_job.queue_adapter = :sidekiq

    # Version information
    config.my_version = 'Version Marketplace 2016.10'

    config.browserify_rails.paths << /frontend\//
  end
end

# To disable automatic retry
Sidekiq.configure_server do |config|
  config.server_middleware do |chain|
    chain.remove Sidekiq::Middleware::Server::RetryJobs
  end
end

DummyText = 'This is dummy!'.freeze
