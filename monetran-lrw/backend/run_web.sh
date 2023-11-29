#!/bin/bash

# Copyright (c) The Diem Core Contributors
# SPDX-License-Identifier: Apache-2.0

#export LIQUIDITY_SERVICE_HOST=liquidity
#export LIQUIDITY_SERVICE_PORT=5000
#export VASP_BASE_URL=http://liquidity:5000/api/offchain

export RUN_BACKGROUND_TASKS="False"

export FLASK_DEBUG=1
export FLASK_ENV=${COMPOSE_ENV:-development}
export FLASK_APP="webapp:init()"

pipenv run flask run --host 0.0.0.0 --port ${WALLET_PORT:-5000} --no-reload
