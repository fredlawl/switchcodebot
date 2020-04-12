#!/usr/bin/env bash

npm run run &> ./logs/$(date --utc +%FT%TZ).log &
