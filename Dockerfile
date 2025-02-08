# ─────────────────────────────────────────────────────────────
# 1) BUILD STAGE
#    - Installs dependencies
#    - Renames postcss.config.js to postcss.config.cjs to fix module errors
#    - Builds the Next.js app (and downloads Chromium via Puppeteer)
# ─────────────────────────────────────────────────────────────

FROM node:18-bullseye-slim AS builder

# Skip Puppeteer's Chromium download since we'll use the system's arm64 version
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install system libraries and Chromium for arm64
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdrm-dev \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxrender1 \
    wget \
    xdg-utils \
    gstreamer1.0-libav \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Fix: Rename postcss.config.js to postcss.config.cjs (to use CommonJS syntax)
RUN if [ -f postcss.config.js ]; then mv postcss.config.js postcss.config.cjs; fi

# Build the Next.js project
RUN npm run build

# ─────────────────────────────────────────────────────────────
# 2) RUNTIME STAGE
#    - Copies build output, node_modules, and the Puppeteer cache from the builder stage
#    - Sets up necessary system libraries
# ─────────────────────────────────────────────────────────────

FROM node:18-bullseye-slim AS runner

# Skip Puppeteer's Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Point to system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install system libraries and Chromium for arm64
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdrm-dev \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxrender1 \
    wget \
    xdg-utils \
    gstreamer1.0-libav \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the production build and required files from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy environment variables
COPY .env ./.env

# If you have a public folder or other static assets, copy them here:
# COPY --from=builder /app/public ./public

# Expose port 3000
EXPOSE 3000

# Start the Next.js app in production mode
CMD ["npm", "start"]