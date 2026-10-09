# TriGuide API — self-hosted on the Linux host (jfhome)
FROM node:20-bookworm-slim AS deps

# better-sqlite3 and bcrypt ship prebuilds, but keep a toolchain available
# so a missing prebuild falls back to a source build instead of failing.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY index.js ./
COPY db ./db
COPY middleware ./middleware
COPY routes ./routes
COPY services ./services

# SQLite lives on a bind mount; uid 1000 matches the host user that owns it.
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]
