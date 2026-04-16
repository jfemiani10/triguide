# TriGuide Agent Notes

## Project Overview

- App name: `TriGuide`
- Frontend: Vite + React in `client/`
- Backend: Express + SQLite in `server/`
- Frontend deploy: Vercel
- Backend deploy: Railway

## Canonical URLs

- Production frontend: `https://triguide.vercel.app`
- Production backend: `https://triguide-production.up.railway.app`
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

- Node version: `20.x` for both frontend and backend
- Frontend build command: `npm run build`
- Frontend output directory: `client/dist`
- Backend start command: `npm run start`

## Environment Variables

Root `.env.example` currently documents:

```env
ANTHROPIC_API_KEY=
JWT_SECRET=
DATABASE_URL=./data/triguide.db
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3001
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

Recommended Strava backend env when OAuth is implemented:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI`

Do not store secrets in repo documentation. Keep real values in platform env settings or local untracked env files.

## Deployment Mapping

Vercel:

- Project root: `client/`
- Framework preset: `Vite`
- `VITE_API_URL` should point to the Railway backend

Railway:

- Project root: `server/`
- Start command: `npm run start`
- `CLIENT_ORIGIN` should be `https://triguide.vercel.app`
- For SQLite, use a writable persistent path for `DATABASE_URL`

## Strava Integration Notes

Current state:

- Backend route exists at `server/routes/strava.js`
- The route is still a placeholder and currently returns `501 Not Implemented`

Recommended callback values:

- Local callback URL: `http://localhost:3001/strava/callback`
- Local authorization callback domain: `localhost`
- Production callback URL: `https://triguide-production.up.railway.app/strava/callback`
- Production authorization callback domain: `triguide-production.up.railway.app`

Important:

- Strava's "Authorization Callback Domain" is the domain only, not the full callback URL
- OAuth redirects should terminate on the backend, not the Vercel frontend

## Useful File References

- Frontend config: `client/package.json`
- Frontend deploy config: `client/vercel.json`
- Backend config: `server/package.json`
- API bootstrap: `server/index.js`
- Auth routes: `server/routes/auth.js`
- Strava routes: `server/routes/strava.js`

## Repo Hygiene

- Do not commit `server/.env`
- Do not commit local SQLite database files
- Prefer adding new env vars to `.env.example` when integration work introduces them
