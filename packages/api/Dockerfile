FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
COPY e2e/package.json ./e2e/

RUN npm ci -w @notes/api --include=dev

COPY tsconfig.base.json ./
COPY packages/api/tsconfig.json ./packages/api/
COPY packages/api/src ./packages/api/src/

RUN npm run build -w @notes/api

FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
COPY e2e/package.json ./e2e/

RUN npm ci -w @notes/api --omit=dev

COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY packages/api/src/infrastructure/database/migrations ./packages/api/dist/infrastructure/database/migrations

WORKDIR /app/packages/api
EXPOSE 3000
CMD ["sh", "-c", "node dist/infrastructure/database/migrate.js && node dist/main.js"]
