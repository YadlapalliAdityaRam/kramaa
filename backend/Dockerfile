FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    openjdk-17-jdk-headless \
    g++ \
    gcc \
    tini \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production

RUN mkdir -p /app/tmp && chown -R node:node /app

USER node

EXPOSE 5000

ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]
