#!/bin/sh

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

PIDS_PATH="${SKYHOPPER_PATH}/tmp/pids"
if [ ! -d $PIDS_PATH ]; then
  mkdir -p $PIDS_PATH
fi

bundle exec foreman start
