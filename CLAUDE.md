# TriGuide — Claude Code Instructions

## Workflow

**After every change, commit and push to the remote.**

```bash
git add <files>
git commit -m "description"
git push
```

Never batch changes across multiple logical steps without committing between them.

## Project Overview

- App name: **TriGuide** — an AI-powered triathlon coaching app
- Frontend: Vite + React in `client/`
- Backend: Express + SQLite (Drizzle ORM) in `server/`
- Frontend deploy: Vercel
- Backend deploy: self-hosted on the Linux host `jfhome` (Docker Compose + systemd),
  public over HTTPS via Tailscale Funnel at `https://jfhome.tail59a720.ts.net`
  (Railway is retired — that URL now 404s)

## Local Development

Frontend (`http://localhost:5173`):

```bash
cd client
npm install
npm run dev
```

Backend (`http://localhost:3001`):

```bash
cd server
npm install
npm run db:push
npm run dev
```

## Environment Variables

See `.env.example` at the repo root. Key vars:

| Variable | Where |
|---|---|
| `VITE_API_URL` | client |
| `ANTHROPIC_API_KEY` | server |
| `JWT_SECRET` | server |
| `DATABASE_URL` | server (SQLite path) |
| `CLIENT_ORIGIN` | server (comma-separated list) |
| `PORT` | server |

Never commit `server/.env` or SQLite `.db` files.

## Key Files

- `server/index.js` — Express bootstrap
- `server/Dockerfile` — Node 20 API image
- `docker-compose.yml` — self-hosted service definition (binds `127.0.0.1:3001`)
- `deploy/` — systemd unit, install script, Funnel script, deployment runbook
- `server/routes/auth.js` — Auth routes
- `server/routes/strava.js` — Strava OAuth (implemented)
- `server/db/` — Drizzle schema and migrations
- `client/src/` — React frontend
- `client/vercel.json` — Vercel deploy config

## Deployment

- **Vercel** (frontend): root `client/`, framework Vite, `VITE_API_URL=https://jfhome.tail59a720.ts.net`
- **Self-hosted** (backend): see `deploy/README.md` for the full runbook.

  ```bash
  docker compose up -d --build        # deploy a backend change
  docker compose logs -f api          # tail logs
  curl -fsS http://127.0.0.1:3001/health
  ```

  Boot persistence is `triguide.service` (install via `sudo ./deploy/install-service.sh`).
  Public HTTPS is Tailscale Funnel (`sudo ./deploy/tailscale-funnel.sh`).

## Strava OAuth

- Backend handles the callback (not the frontend)
- Callback URL: `https://jfhome.tail59a720.ts.net/strava/callback`
- Authorization Callback Domain (Strava app settings): `jfhome.tail59a720.ts.net`
