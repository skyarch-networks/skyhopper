#!/bin/sh

cd /prj/skyhopper

echo "===== Install the library ====="
bundle install --path vendor/bundle
cd frontend/
~/.yarn/bin/yarn
cd ..

echo "===== Set up the dummy font ====="
if [[ ! -e frontend/fonts/fonts_map.js ]]; then
  echo 'module.exports = {"dummy":{"normal":"dummy","bold":"dummy","italics":"dummy","bolditalics":"dummy"}};' > frontend/fonts/fonts_map.js
fi

echo "===== Set up the database ====="
sleep 30 # Wait for the container to start up
bundle exec rails db:create
bundle exec rails db:migrate
bundle exec rails db:seed

echo "===== Configure the application ====="
bundle exec rails i18n:js:export
bundle exec rails assets:precompile
