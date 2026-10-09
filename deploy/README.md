# TriGuide Backend — Self-Hosted Deployment

The backend no longer runs on Railway (that project is gone; the URL returns 404).
It runs on the Linux host `jfhome` as a Docker Compose service, exposed publicly
over HTTPS by Tailscale Funnel.

```
Vercel (https://triguide.vercel.app)
        │ HTTPS
        ▼
https://jfhome.tail59a720.ts.net      ← Tailscale Funnel (TLS terminated by Tailscale)
        │
        ▼
127.0.0.1:3001                        ← triguide-api container
        │
        ▼
server/data/triguide.db               ← SQLite on a host bind mount
```

## Layout

| File | Purpose |
|---|---|
| `server/Dockerfile` | Node 20 image for the API (matches `engines` in `server/package.json`) |
| `docker-compose.yml` | Service definition; binds `127.0.0.1:3001`, mounts `server/data` |
| `deploy/triguide.service` | systemd unit (`oneshot` + `RemainAfterExit`, same pattern as `ai-clipper`) |
| `deploy/install-service.sh` | Installs + enables the unit (needs root) |
| `deploy/tailscale-funnel.sh` | Turns on Funnel for port 3001 (needs root) |
| `deploy/finish-migration.sh` | Does steps 2-5 below in one go (needs root) |

## Finishing the migration in one command

```bash
sudo ./deploy/finish-migration.sh
```

It repairs systemd if needed, starts the container, installs the unit, and turns on
Funnel. The steps below are the same work done by hand.

### Known host issue

Since 2026-10-01, PID 1 on `jfhome` has not been answering D-Bus: `systemctl` times
out and Docker cannot create container cgroup scopes, so `docker compose up` fails
with `unable to apply cgroup configuration`. Already-running containers are
unaffected. Fix, in order of escalation:

```bash
sudo kill -USR1 1    # systemd: reconnect to D-Bus
sudo kill -TERM 1    # systemd: re-exec (same as daemon-reexec); keeps services running
sudo reboot          # last resort
```

## First-time setup

1. **Fill in `server/.env`** (untracked). See `.env.example`.
   `CLIENT_ORIGIN` accepts a comma-separated list, so the deployed frontend and a
   local dev client can both be allowed.

2. **Build and start the container:**

   ```bash
   cd /home/jonahhome/projects/triguide
   docker compose up -d --build
   curl -fsS http://127.0.0.1:3001/health
   ```

3. **Make it boot-persistent:**

   ```bash
   sudo ./deploy/install-service.sh
   ```

4. **Enable HTTPS + Funnel in the Tailscale admin console** (one-time, browser):
   - DNS → enable **HTTPS Certificates**
   - Access controls → give this node the `funnel` nodeAttr

5. **Turn on Funnel:**

   ```bash
   sudo ./deploy/tailscale-funnel.sh
   curl -fsS https://jfhome.tail59a720.ts.net/health
   ```

6. **Repoint the frontend:** in Vercel, set
   `VITE_API_URL=https://jfhome.tail59a720.ts.net` and redeploy.

7. **Repoint Strava** (https://www.strava.com/settings/api):
   - Authorization Callback Domain: `jfhome.tail59a720.ts.net`
   - `STRAVA_REDIRECT_URI` in `server/.env`:
     `https://jfhome.tail59a720.ts.net/strava/callback`

## Day-to-day

```bash
docker compose logs -f api          # tail logs
docker compose up -d --build        # deploy a code change
sudo systemctl restart triguide     # restart via systemd
tailscale funnel status             # confirm the public route
```

## Backups

The whole database is one file: `server/data/triguide.db`. Back it up with the
container running using SQLite's online backup:

```bash
docker compose exec api node -e \
  "new (require('better-sqlite3'))('/app/data/triguide.db').backup('/app/data/backup-'+Date.now()+'.db')"
```

`server/data/tricoach.db` is an empty legacy file from the pre-rename schema and is
not used by the app.

## Operational notes

- Funnel supports only ports 443, 8443 and 10000 — the scripts use 443.
- The container binds to loopback only; nothing is reachable from the LAN directly.
- Host Node is 24.x; the container pins 20.x, so always test through the container.
