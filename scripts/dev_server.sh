#!/bin/sh

#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

at_exit() {
  kill $PID_WS_PROXY
  kill $(cat ./tmp/pids/sidekiq.pid)
}
trap at_exit SIGINT

#TODO: Go websocket server
./bin/ws_proxy --log ./log/ws_proxy.log &
PID_WS_PROXY=$!

bundle exec sidekiq -d

bundle exec rails s -b127.0.0.1
