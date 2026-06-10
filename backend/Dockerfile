FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 4000

FROM dev AS builder
RUN npm run build
RUN cp -r src/db/migrations dist/db/migrations

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev
EXPOSE 4000
CMD ["node", "dist/index.js"]
