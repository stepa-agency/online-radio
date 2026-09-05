FROM node:20-slim

WORKDIR /app

# build-essential/python3 let npm compile better-sqlite3 from source if a
# prebuilt binary isn't available for this platform
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
