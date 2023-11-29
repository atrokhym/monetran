#!/bin/bash

set -euxo pipefail

#env

envsubst < /etc/bridge.cfg.template > /etc/bridge.cfg
#cat /etc/bridge.cfg
#echo $BRIDGE_CONFIG_FILE
ls -l /usr/local/bin

/usr/local/bin/bridge --migrate-db -c /etc/bridge.cfg

#echo "config file: " $BRIDGE_CONFIG_FILE
exec /usr/local/bin/bridge -c $BRIDGE_CONFIG_FILE $@
#./bridge -c $BRIDGE_CONFIG_FILE $@
