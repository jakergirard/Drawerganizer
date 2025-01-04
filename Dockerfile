FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    sqlite-dev \
    vips-dev

# Update npm to latest version
RUN npm install -g npm@10.9.2

# Install all dependencies including dev dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/database.db"
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    sqlite \
    sqlite-dev \
    vips \
    fontconfig \
    ttf-liberation

# Copy production files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create data directory
RUN mkdir -p /app/data && chmod 777 /app/data

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:/app/data/database.db"

# Copy and set up start script
COPY start.sh ./
RUN chmod +x start.sh

# Create font directory and copy Arial
RUN mkdir -p /usr/share/fonts/truetype/
COPY public/fonts/arial.ttf /usr/share/fonts/truetype/
RUN fc-cache -f -v

# Expose port
EXPOSE 3000

CMD ["./start.sh"]
