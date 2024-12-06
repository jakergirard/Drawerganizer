#!/bin/sh

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Initialize the database
echo "Initializing fresh database..."
if [ -f /app/data/database.db ]; then
    echo "Removing existing database..."
    rm /app/data/database.db
fi

# Run migrations to create fresh database
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
exec node server.js 