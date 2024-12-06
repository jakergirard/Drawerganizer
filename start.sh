#!/bin/sh

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Initialize the database if it doesn't exist
if [ ! -f /app/data/database.db ]; then
    echo "Database file not found. Initializing database..."
    npx prisma migrate deploy
else
    echo "Using existing database..."
    # Run any pending migrations
    npx prisma migrate deploy
fi

# Start the application
echo "Starting application..."
exec node server.js 