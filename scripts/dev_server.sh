#!/bin/sh

#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

#TODO: Go websocket server
./bin/ws_proxy --log ./log/ws_proxy.log &
PID_WS_PROXY=$!

trap "kill ${PID_WS_PROXY}" 2
bundle exec rails s -b127.0.0.1
