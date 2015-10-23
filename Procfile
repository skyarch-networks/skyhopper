job: bundle exec sidekiq
web: bundle exec rails server -b127.0.0.1
worker: bundle exec crono -C config/cronotab.rb -L log/crono.log -P crono.pid  RAILS_ENV=development
ws:  ./bin/ws_proxy
