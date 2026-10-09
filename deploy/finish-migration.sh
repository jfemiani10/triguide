#!/usr/bin/env bash
# Finish the TriGuide backend migration onto this host. Needs root:
#
#   sudo ./deploy/finish-migration.sh
#
# Steps:
#   1. Repair systemd's D-Bus connection if it is wedged (see note below)
#   2. Build and start the triguide-api container
#   3. Install and enable triguide.service so it survives reboot
#   4. Turn on Tailscale Funnel and verify the public HTTPS endpoint
#
# Note on step 1: since 2026-10-01 PID 1 on this host has not been answering
# D-Bus, so `systemctl` times out and Docker cannot create container cgroup
# scopes. SIGUSR1 tells the systemd manager to reconnect to the bus; SIGTERM
# makes it serialize, re-exec and deserialize its state (the same thing
# `systemctl daemon-reexec` does). Neither restarts running services.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=3001

if [[ $EUID -ne 0 ]]; then
  echo "error: must run as root (sudo $0)" >&2
  exit 1
fi

systemd_responsive() {
  timeout 20 systemctl is-system-running >/dev/null 2>&1 \
    || timeout 20 systemctl list-units --no-pager >/dev/null 2>&1
}

step() { printf '\n=== %s ===\n' "$1"; }

step "1/4 systemd health"
if systemd_responsive; then
  echo "systemd is answering D-Bus — no repair needed."
else
  echo "systemd is not answering D-Bus. Sending SIGUSR1 (reconnect to bus)..."
  kill -USR1 1
  sleep 8
  if systemd_responsive; then
    echo "Recovered after SIGUSR1."
  else
    echo "Still wedged. Sending SIGTERM (re-exec, equivalent to daemon-reexec)..."
    kill -TERM 1
    sleep 15
    if systemd_responsive; then
      echo "Recovered after re-exec."
    else
      echo
      echo "systemd is still unresponsive. A reboot is the remaining fix:" >&2
      echo "  sudo reboot" >&2
      echo "Containers with restart policies (ai-clipper, tri-mail) come back on boot." >&2
      exit 1
    fi
  fi
fi

step "2/4 start the API container"
cd "$REPO_DIR"
docker compose up -d --build --remove-orphans
sleep 6
docker compose ps
curl -fsS "http://127.0.0.1:${PORT}/health" && echo " <- loopback health OK"

step "3/4 install systemd unit"
install -m 0644 "$REPO_DIR/deploy/triguide.service" /etc/systemd/system/triguide.service
systemctl daemon-reload
systemctl enable triguide.service
echo "triguide.service enabled (the stack is already running from step 2)."

step "4/4 Tailscale Funnel"
DNS_NAME="$(tailscale status --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
if tailscale funnel --bg --https=443 "http://127.0.0.1:${PORT}"; then
  tailscale funnel status
  echo
  echo "Verifying public endpoint (TLS issuance can take a few seconds)..."
  for _ in 1 2 3 4 5 6; do
    if curl -fsS --max-time 10 "https://${DNS_NAME}/health"; then
      echo " <- public health OK"
      break
    fi
    sleep 10
  done
else
  cat <<MSG

Funnel could not be enabled. Both of these are one-time browser steps:
  - https://login.tailscale.com/admin/dns      -> enable HTTPS Certificates
  - https://login.tailscale.com/admin/acls     -> give this node the "funnel" nodeAttr
Then re-run: sudo ./deploy/tailscale-funnel.sh
MSG
fi

cat <<MSG

=== Remaining manual steps (not scriptable) ===
  1. Vercel -> TriGuide project -> Settings -> Environment Variables:
       VITE_API_URL = https://${DNS_NAME}
     then redeploy the frontend.
  2. https://www.strava.com/settings/api:
       Authorization Callback Domain = ${DNS_NAME}
MSG
