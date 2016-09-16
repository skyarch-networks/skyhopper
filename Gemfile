source 'https://rubygems.org'

gem 'rails', '~> 4.2.7.1'

# Use mysql as the database for Active Record
gem 'mysql2'
gem 'activerecord-import'

# Use SCSS as CSS compressor
gem 'sass-rails'

# https://github.com/skyarch-networks/skyhopper/pull/165
# sprockets-rails has some problems. we fix version until it's stable.
gem 'sprockets-rails', '~> 2'

# Use Uglifier as compressor for JavaScript assets
gem 'uglifier'#, '>= 1.3.0'

# Use CoffeeScript for .js.coffee assets and views
gem 'coffee-rails'

# See https://github.com/sstephenson/execjs#readme for more supported runtimes
gem 'therubyracer', platforms: :ruby
gem 'libv8'

# Turbolinks makes following links in your web application faster. Read more: https://github.com/rails/turbolinks
# gem 'turbolinks'

# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder'

# Modularize javascript code in application
gem 'browserify-rails'

group :doc do
  # bundle exec rake doc:rails generates the API under doc/api.
  gem 'sdoc', require: false
end

# Use unicorn as the app server
gem 'unicorn-rails'

gem "font-awesome-rails"

gem 'aws-sdk-v1'
gem 'aws-sdk', '~> 2'
gem 'ridley'
gem "net-ssh"
gem "net-scp"

gem "knife-windows"
gem "chef", "~> 12", require: false
gem 'serverspec', require: false # serverspec is used only by rake serverspec
gem 'specinfra', require: false
gem 'highline'
gem 'sidekiq', "~> 3.4.2" # for Active Job
gem 'crono' # for Active Job
gem 'foreman', require: false

gem "bootstrap-table-rails"

# Temporarily set ruby_dep version to 1.3.1 because it requires ruby 2.2.5 that is not yet available on amazon linux
gem "ruby_dep", "~> 1.3.1"

group :development, :test do
  # debug
  gem "tapp"
  gem "better_errors"
  gem 'binding_of_caller'
  gem 'bullet'
  gem 'pry'
  gem "pry-rails"
  gem "pry-doc"
  gem 'pry-remote'
  gem "awesome_print"
  gem 'rack-contrib'
  gem 'ruby-prof'

  gem 'quiet_assets'

  # test
  gem "rspec-rails"
  gem "factory_girl_rails"
  gem "database_cleaner"
  gem 'guard-rspec'
  gem 'coveralls', require: false
  gem 'named_let'

  gem 'sqlite3'

  # document
  gem 'railroady'
  gem 'autodoc'
  gem 'yard'
  gem 'redcarpet'
  gem 'github-markup'

  gem 'rubocop', require: false

  gem 'spring'
  gem 'sprint'
  gem 'spring-commands-rspec'
  gem 'spring-commands-sidekiq'
end

# for Login
gem 'devise', '~> 3.5.3'
gem 'pundit'

# pagination
gem 'kaminari'

gem 'i18n', '0.7.0'
gem 'i18n-js'
gem 'devise-i18n'
gem 'rails-i18n'

gem 'redis-store'
gem 'redis-rails'
gem 'redis'
gem 'hiredis'

# For mfa
gem 'rotp'
gem 'rqrcode'

gem 'sky_zabbix', '~> 2.2.0'

gem 'nokogiri', '>= 1.6.8'

gem 'rails-html-sanitizer', '~> 1.0.3'

gem 'rubyzip'
