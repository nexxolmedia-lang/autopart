# syntax=docker/dockerfile:1.7
#
# AutoPart production image (Next.js standalone output).
#
#   docker build -t autopart .                       # app image   (target: runner)
#   docker build -t autopart-migrate --target migrate .   # one-shot migrations
#
# See docker-compose.yml for a complete stack and docs/DEPLOYMENT.md.

ARG NODE_VERSION=22-bookworm-slim

# ── Dependencies ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
# postinstall runs `prisma generate`, which needs the schema copied above.
RUN npm ci --no-audit --no-fund

# ── Build ───────────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
RUN npm run build

# ── Migrations (run once per deploy, before starting the app) ───────────────
FROM deps AS migrate
WORKDIR /app
# Full source: the optional demo seed (`npx prisma db seed`) uses the app's services.
COPY . .
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]

# ── Runtime ─────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
