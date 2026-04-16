# TriGuide

TriGuide is a triathlon coaching web app with a Vite/React frontend and an Express/SQLite backend.

## Structure

- `client/`: Vite React app for Vercel
- `server/`: Express API for Railway

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

- `VITE_API_URL`: public backend URL, for example `https://your-backend.up.railway.app`

Backend on Railway:

- `ANTHROPIC_API_KEY`
- `JWT_SECRET`
- `DATABASE_URL`
- `NODE_ENV=production`
- `PORT`
- `CLIENT_ORIGIN`: frontend Vercel URL, for example `https://your-app.vercel.app`

## Deployment

### Frontend: Vercel

Create a Vercel project using `client/` as the root directory.

Recommended settings:

- Framework preset: `Vite`
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Set:

- `VITE_API_URL=https://your-backend.up.railway.app`

`client/vercel.json` includes an SPA rewrite so React Router routes resolve correctly.

### Backend: Railway

Create a Railway project using `server/` as the root directory.

Recommended settings:

- Start Command: `npm run start`

Set the backend environment variables listed above. For SQLite on Railway, prefer a persistent volume and point `DATABASE_URL` at a writable path on that volume.

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
