FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001

RUN addgroup --system --gid 1001 admin \
    && adduser --system --uid 1001 --ingroup admin admin

COPY --from=builder --chown=admin:admin /app/build ./build

USER admin

EXPOSE 3001

CMD ["node", "build"]
