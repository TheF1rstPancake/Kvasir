#!/usr/bin/env bash

ln -s /node/node_modules /app/node_modules

exec "$@"
