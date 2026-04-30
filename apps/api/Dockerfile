FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/
COPY libs/types/package.json ./libs/types/

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build:api

# ---

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs \
  && apk add --no-cache openssl

COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma

RUN mkdir -p /app/uploads && chown nestjs:nodejs /app/uploads

USER nestjs

EXPOSE 3333

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
