#!/bin/bash
# restart.sh — rebuild and restart pansion backend
set -e

PROJECT="/root/pansion"
BINARY="/usr/local/bin/pansion"

echo "==> building..."
cd "$PROJECT/backend"
export PATH=/usr/local/go/bin:$PATH
go build -o "$BINARY" ./cmd/server/

echo "==> restarting service..."
systemctl restart pansion

echo "==> waiting..."
sleep 2

echo "==> status..."
systemctl status pansion --no-pager -l
