#!/bin/sh
cd /prj/skyhopper
bundle exec foreman start -f Procfile.docker &
foreman_pid=$!

trap_TERM() {
  kill $foreman_pid
  while kill -0 $foreman_pid
  do
    sleep 1
  done
  exit 0
}
trap 'trap_TERM' TERM

while :
do
  sleep 1
done
