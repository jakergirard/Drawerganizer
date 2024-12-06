FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

# Copy package files
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install build dependencies in builder stage too
RUN apk add --no-cache python3 make g++ pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev cairo pango jpeg giflib librsvg

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client
RUN npx prisma generate

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies and build tools
RUN apk add --no-cache python3 make g++ pkgconfig cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev cairo pango jpeg giflib librsvg

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production --legacy-peer-deps

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create data directory with proper permissions
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 3000

ENV PORT=3000
ENV DATABASE_URL="file:/app/data/database.db"

# Initialize fresh database on container start
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
