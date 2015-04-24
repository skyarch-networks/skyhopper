#!/bin/bash

#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#


# default set SkyHopper path
if [ -z "$SKYHOPPER_PATH" ]; then
  SKYHOPPER_PATH="$(cd $(dirname $0); cd ../; pwd)"
fi


export RAILS_ENV=production


get_pid() {
  pid_path="${SKYHOPPER_PATH}/tmp/pids/unicorn.pid"
  if [ -f "${pid_path}" ]; then
    cat $SKYHOPPER_PATH/tmp/pids/unicorn.pid
  else
    return 1
  fi
}

start() {
  cd $SKYHOPPER_PATH
  echo -e "\e[1m=====\e[32m Generating i18n-js dictionary\e[m"
  bundle exec rake i18n:js:export

  echo -e "\e[1m=====\e[32m Precompile assets\e[m"
  bundle exec rake assets:precompile


  echo -e "\e[1m=====\e[32m Start Websocket Server as daemon\e[m"
  ./bin/ws_proxy --log ./log/ws_proxy.production.log &
  pid=$!
  echo -n $pid > ./tmp/pids/ws_proxy.pid

  echo -e "\e[1m=====\e[32m Start Sidekiq as daemon\e[m"
  bundle exec sidekiq -e production -d

  echo -e "\e[1m=====\e[32m Start Rails Server as daemon\e[m"
  bundle exec unicorn_rails -E production -D -p3000
}

stop() {
  echo -e "\e[1m=====\e[32m Kill Websocket Server daemon\e[m"
  kill $(cat ./tmp/pids/ws_proxy.pid)

  echo -e "\e[1m=====\e[32m Kill Sidekiq daemon\e[m"
  kill $(cat ./tmp/pids/sidekiq.pid)

  pid=$(get_pid)
  echo -e "\e[1m=====\e[32m Kill Rails Server daemon\e[m"
  kill $pid
}

status() {
  pid=$(get_pid)
  if [ $? -ne 0 ] ; then
    echo "stop SkyHopper"
    return
  fi

  if kill -0 "${pid}" > /dev/null 2>&1 ; then
    echo "running SkyHopper"
  else
    echo "stop SkyHopper"
  fi
}

case $1 in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    status
    ;;
  *)
    echo $"Usage: $0 {start|stop|status}"
    exit 1
esac

exit 0
