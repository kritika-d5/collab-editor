# ── dev stage ──────────────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173

# ── build stage ────────────────────────────────────────────
FROM dev AS builder
RUN npm run build

# ── production stage ───────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
