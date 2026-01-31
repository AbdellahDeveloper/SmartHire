FROM oven/bun:latest

RUN apt-get update && apt-get install -y ca-certificates openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun prisma generate

EXPOSE 3012
CMD ["bun", "src/index.ts"]
