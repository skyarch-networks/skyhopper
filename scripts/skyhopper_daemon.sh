#!/bin/bash

#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
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

pid_file() {
  pid_path="${SKYHOPPER_PATH}/tmp/pids/foreman.pid"
  echo -n $pid_path
}

get_pid() {
  pid_path=$(pid_file)
  if [ -f "${pid_path}" ]; then
    cat $pid_path
  else
    return 1
  fi
}

# $1: pid
save_pid() {
  pid_path=$(pid_file)
  echo -n $1 > $pid_path
}

test_or_create_pids_dir() {
  pids_path="${SKYHOPPER_PATH}/tmp/pids"
  if [ ! -d $pids_path ]; then
    mkdir -p $pids_path
  fi
}

start() {
  test_or_create_pids_dir

  cd $SKYHOPPER_PATH
  echo -e "\e[1m=====\e[32m Generating i18n-js dictionary\e[m"
  bundle exec rails i18n:js:export

  echo -e "\e[1m=====\e[32m Precompile assets\e[m"
  bundle exec rails assets:precompile


  echo -e "\e[1m=====\e[32m Start Rails/Sidekiq/Websocket servers\e[m"
  bundle exec foreman start > /dev/null 2>&1 &
  pid=$!
  save_pid $pid
}

stop() {
  echo -e "\e[1m=====\e[32m Kill Rails/Sidekiq/Websocket Servers\e[m"
  pid=$(get_pid)
  kill $pid
  rm $(pid_file)
}

status() {
  pid=$(get_pid)
  if [ $? -ne 0 ] ; then
    echo "SkyHopper is stopping"
    return
  fi

  if kill -0 "${pid}" > /dev/null 2>&1 ; then
    echo "SkyHopper is running"
  else
    echo "SkyHopper is stopping"
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
