# ── dev stage ──────────────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 4000

# ── build stage ────────────────────────────────────────────
FROM dev AS builder
RUN npm run build

# ── production stage ───────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm install --omit=dev
EXPOSE 4000
CMD ["node", "dist/index.js"]
