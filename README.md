# TriGuide

TriGuide is a triathlon coaching web app with a Vite/React frontend and an Express/SQLite backend.

## Structure

- `client/`: Vite React app for Vercel
- `server/`: Express API, self-hosted on the `jfhome` Linux host
- `deploy/`: systemd unit and setup scripts for the self-hosted backend

## Local development

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

## Environment variables

Frontend on Vercel:

- `VITE_API_URL`: public backend URL, `https://jfhome.tail59a720.ts.net`

Backend (`server/.env`, untracked):

- `ANTHROPIC_API_KEY`
- `JWT_SECRET`
- `DATABASE_URL`: `/app/data/triguide.db` under Docker, `./data/triguide.db` when run bare
- `NODE_ENV=production`
- `PORT`, `HOST`
- `CLIENT_ORIGIN`: comma-separated allowed origins, e.g. `https://triguide.vercel.app,http://localhost:5173`
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`

## Deployment

### Frontend: Vercel

Create a Vercel project using `client/` as the root directory.

Recommended settings:

- Framework preset: `Vite`
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Set:

- `VITE_API_URL=https://jfhome.tail59a720.ts.net`

`client/vercel.json` includes an SPA rewrite so React Router routes resolve correctly.

### Backend: self-hosted on `jfhome`

The backend runs as a Docker Compose service on the Linux host and is published
publicly over HTTPS by Tailscale Funnel. Railway is retired.

```bash
docker compose up -d --build          # build and start
curl -fsS http://127.0.0.1:3001/health
sudo ./deploy/install-service.sh      # enable at boot (systemd)
sudo ./deploy/tailscale-funnel.sh     # expose publicly over HTTPS
```

The SQLite database is a single file on a host bind mount: `server/data/triguide.db`.

See `deploy/README.md` for the full runbook, including the Tailscale admin console
prerequisites and backup commands.

## GitHub

This repo is ready to be initialized and pushed:

```bash
git init
git add .
git commit -m "Initial TriGuide app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

Do not commit `server/.env` or the local SQLite database files.
