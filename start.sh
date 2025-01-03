#!/bin/sh

# Ensure data directory exists and has correct permissions
mkdir -p /app/data
chown -R node:node /app/data
chmod 755 /app/data

# Initialize database if it doesn't exist
if [ ! -f /app/data/database.db ]; then
    echo "Initializing database..."
    touch /app/data/database.db
    chown node:node /app/data/database.db
    chmod 644 /app/data/database.db
fi

# Start the application with optimized memory settings
exec node --initial-heap-size=32MB --max-old-space-size=64 server.js 