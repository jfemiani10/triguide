# TriGuide Agent Notes

## Project Overview

- App name: `TriGuide`
- Frontend: Vite + React in `client/`
- Backend: Express + SQLite in `server/`
- Frontend deploy: Vercel
- Backend deploy: self-hosted on the Linux host `jfhome` (Docker Compose + systemd)

## Canonical URLs

- Production frontend: `https://triguide.vercel.app`
- Production backend: `https://jfhome.tail59a720.ts.net` (Tailscale Funnel -> `127.0.0.1:3001` on `jfhome`)
- Retired: `https://triguide-production.up.railway.app` (Railway project deleted; returns 404)
- Local frontend: `http://localhost:5173`
- Local backend: `http://localhost:3001`

## Local Development

Frontend:

```bash
cd client
npm install
npm run dev
```

Backend:

```bash
cd server
npm install
npm run db:push
npm run dev
```

## Runtime And Build Notes

- Node version: frontend `24.x` (Vercel discontinued 20.x builds); backend container pins `20.x`; host Node is 24.x
- Frontend build command: `npm run build`
- Frontend output directory: `client/dist`
- Backend start command: `npm run start`

## Environment Variables

Root `.env.example` currently documents:

```env
ANTHROPIC_API_KEY=
JWT_SECRET=
DATABASE_URL=/app/data/triguide.db
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
CLIENT_ORIGIN=https://triguide.vercel.app,http://localhost:5173
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=https://jfhome.tail59a720.ts.net/strava/callback
VITE_API_URL=https://jfhome.tail59a720.ts.net
```

Expected frontend env:

- `VITE_API_URL`

Expected backend env:

- `ANTHROPIC_API_KEY`
- `JWT_SECRET`
- `DATABASE_URL`
- `NODE_ENV`
- `PORT`
- `CLIENT_ORIGIN`

Strava backend env:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI`

Do not store secrets in repo documentation. Keep real values in platform env settings or local untracked env files.

## Deployment Mapping

Vercel:

- Project root: `client/`
- Framework preset: `Vite`
- `VITE_API_URL` should be `https://jfhome.tail59a720.ts.net`

Self-hosted backend (`jfhome`):

- Repo dir: `/home/jonahhome/projects/triguide`
- `docker compose up -d --build` builds `server/Dockerfile` and runs `triguide-api`
- Published on `127.0.0.1:3001` only; Tailscale Funnel terminates TLS on 443
- systemd unit: `triguide.service` (`deploy/triguide.service`, `oneshot` + `RemainAfterExit`)
- SQLite persists via the `./server/data` bind mount; container path `/app/data/triguide.db`
- `CLIENT_ORIGIN` is a comma-separated list: `https://triguide.vercel.app,http://localhost:5173`
- Full runbook: `deploy/README.md`

## Strava Integration Notes

Current state:

- OAuth is implemented in `server/routes/strava.js` and `server/services/strava.js`
  (connect-url, callback, sync, activity prefill, disconnect)

Recommended callback values:

- Local callback URL: `http://localhost:3001/strava/callback`
- Local authorization callback domain: `localhost`
- Production callback URL: `https://jfhome.tail59a720.ts.net/strava/callback`
- Production authorization callback domain: `jfhome.tail59a720.ts.net`

Important:

- Strava's "Authorization Callback Domain" is the domain only, not the full callback URL
- OAuth redirects should terminate on the backend, not the Vercel frontend

## Useful File References

- Frontend config: `client/package.json`
- Frontend deploy config: `client/vercel.json`
- Backend config: `server/package.json`
- Backend image: `server/Dockerfile`
- Self-host compose file: `docker-compose.yml`
- Deployment runbook: `deploy/README.md`
- API bootstrap: `server/index.js`
- Auth routes: `server/routes/auth.js`
- Strava routes: `server/routes/strava.js`

## Repo Hygiene

- Do not commit `server/.env`
- Do not commit local SQLite database files
- `server/data/tricoach.db` is an unused legacy file; the live database is `server/data/triguide.db`
- Prefer adding new env vars to `.env.example` when integration work introduces them
