#!/bin/sh

# Initialize database if it doesn't exist
if [ ! -f /app/data/database.db ]; then
    echo "Creating database..."
    sqlite3 /app/data/database.db "
        CREATE TABLE Drawer (
            id TEXT PRIMARY KEY,
            size TEXT NOT NULL,
            title TEXT NOT NULL,
            name TEXT,
            positions TEXT NOT NULL,
            isRightSection BOOLEAN NOT NULL,
            keywords TEXT NOT NULL,
            spacing INTEGER NOT NULL
        );

        CREATE TABLE PrinterConfig (
            id INTEGER PRIMARY KEY,
            printerName TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL
        );

        INSERT INTO PrinterConfig (id, printerName, host, port) 
        VALUES (1, 'Default Printer', 'localhost', 631);
    "
fi

# Start the application
exec node server.js 