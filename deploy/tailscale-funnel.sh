#!/usr/bin/env bash
# Expose the loopback-bound TriGuide API publicly over HTTPS via Tailscale Funnel.
# Run with sudo: sudo ./deploy/tailscale-funnel.sh
#
# Prerequisites in the Tailscale admin console (one-time, browser):
#   1. DNS page  -> enable HTTPS Certificates
#   2. Access controls -> grant this node the "funnel" nodeAttr
# Funnel only supports ports 443, 8443 and 10000; 443 is used here.
set -euo pipefail

PORT="${PORT:-3001}"

if [[ $EUID -ne 0 ]]; then
  echo "error: tailscale serve/funnel requires root (sudo $0)" >&2
  exit 1
fi

tailscale funnel --bg --https=443 "http://127.0.0.1:${PORT}"
tailscale funnel status

echo
DNS_NAME="$(tailscale status --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
echo "Public URL: https://${DNS_NAME}"
echo "Set this as VITE_API_URL in Vercel, and as the Strava callback domain."
