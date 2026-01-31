FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
RUN bunx prisma generate


FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production
# other env var needed
# MONGODB_URL
# MONGODB_DB_NAME

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/bun.lockb* ./
COPY --from=base /app/src ./src

EXPOSE 3040

CMD ["bun", "run", "src/index.ts"]
