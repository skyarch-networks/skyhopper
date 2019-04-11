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
sleep 10 # Wait for the container to start up
bundle exec rake db:create
bundle exec rake db:migrate
bundle exec rake db:seed

echo "===== Configure the application ====="
bundle exec rake i18n:js:export
bundle exec rake assets:precompile
