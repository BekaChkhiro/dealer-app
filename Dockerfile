# Playwright base image ships Chromium + all system deps + Node 20, matching the
# `playwright` npm version so the server can scrape Cloudflare-protected pages.
FROM mcr.microsoft.com/playwright:v1.61.0-jammy

WORKDIR /app

# Browsers are already in the image; don't re-download during npm install.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Install dependencies first (better layer caching). Root postinstall installs
# client + server deps. NODE_ENV is NOT production here so client devDeps (vite)
# are available for the build.
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm install

# Copy source and build the client bundle.
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 5000

# Runs migrations then starts the server (same as before).
CMD ["npm", "start"]
