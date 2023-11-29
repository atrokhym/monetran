#!/bin/bash

set -euxo pipefail

cd /tmp

curl -fsSLO https://github.com/stellar-deprecated/bridge-server/releases/download/v0.0.31/bridge-v0.0.31-linux-amd64.tar.gz
#ls -al
tar -xzvf bridge-v0.0.31-linux-amd64.tar.gz
mv bridge-v0.0.31-linux-amd64/bridge /usr/local/bin

#ls -al /usr/local/bin

#curl -fsSLO https://github.com/stellar/go/archive/horizonclient-v1.5.0.tar.gz
#tar -xvf horizonclient-v1.5.0.tar.gz


chown root.root /usr/local/bin/bridge

cd -
