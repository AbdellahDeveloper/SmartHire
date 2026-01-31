FROM oven/bun:latest

RUN apt-get update && apt-get install -y ca-certificates openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun prisma generate

ENV NODE_ENV=production
RUN bun run build

EXPOSE 3000
# Run prisma db push before starting the app
CMD bunx prisma db push && bun run start
