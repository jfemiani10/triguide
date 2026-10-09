#!/usr/bin/env bash
# Install the TriGuide API as a boot-persistent systemd service on this host.
# Run with sudo: sudo ./deploy/install-service.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_SRC="$REPO_DIR/deploy/triguide.service"
UNIT_DEST="/etc/systemd/system/triguide.service"

if [[ $EUID -ne 0 ]]; then
  echo "error: must run as root (sudo $0)" >&2
  exit 1
fi

if [[ ! -f "$REPO_DIR/server/.env" ]]; then
  echo "error: server/.env is missing — copy .env.example and fill it in first" >&2
  exit 1
fi

install -m 0644 "$UNIT_SRC" "$UNIT_DEST"
systemctl daemon-reload
systemctl enable --now triguide.service
systemctl --no-pager status triguide.service || true

echo
echo "Checking API health on loopback..."
sleep 5
curl -fsS http://127.0.0.1:3001/health && echo " <- API is up"
