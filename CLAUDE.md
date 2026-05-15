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
- Backend deploy: Railway

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
| `CLIENT_ORIGIN` | server |
| `PORT` | server |

Never commit `server/.env` or SQLite `.db` files.

## Key Files

- `server/index.js` — Express bootstrap
- `server/routes/auth.js` — Auth routes
- `server/routes/strava.js` — Strava OAuth (currently 501 placeholder)
- `server/db/` — Drizzle schema and migrations
- `client/src/` — React frontend
- `client/vercel.json` — Vercel deploy config

## Deployment

- **Vercel**: root `client/`, framework Vite, set `VITE_API_URL` to Railway backend URL
- **Railway**: root `server/`, start command `npm run start`, set `CLIENT_ORIGIN` to `https://triguide.vercel.app`

## Strava OAuth

- Backend handles the callback (not the frontend)
- Callback URL: `https://triguide-production.up.railway.app/strava/callback`
- Authorization Callback Domain (Strava app settings): `triguide-production.up.railway.app`
