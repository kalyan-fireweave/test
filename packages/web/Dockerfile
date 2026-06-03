FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
COPY e2e/package.json ./e2e/

RUN npm ci -w @notes/web --include=dev

COPY packages/web/svelte.config.js packages/web/vite.config.ts packages/web/tsconfig.json ./packages/web/
COPY packages/web/src ./packages/web/src
COPY packages/web/static ./packages/web/static

RUN npm run build -w @notes/web

FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
COPY e2e/package.json ./e2e/

RUN npm ci -w @notes/web --omit=dev

COPY --from=builder /app/packages/web/build ./packages/web/build

WORKDIR /app/packages/web
EXPOSE 4376
CMD ["node", "build"]
