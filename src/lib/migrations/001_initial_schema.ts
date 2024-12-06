import { Database } from 'sqlite';

export async function up(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS Drawer (
            id TEXT PRIMARY KEY,
            size TEXT NOT NULL,
            title TEXT NOT NULL,
            name TEXT,
            positions TEXT NOT NULL,
            isRightSection INTEGER NOT NULL,
            keywords TEXT NOT NULL,
            spacing INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Add indices for frequently queried columns
        CREATE INDEX IF NOT EXISTS idx_drawer_size ON Drawer(size);
        CREATE INDEX IF NOT EXISTS idx_drawer_title ON Drawer(title);
        CREATE INDEX IF NOT EXISTS idx_drawer_keywords ON Drawer(keywords);
        CREATE INDEX IF NOT EXISTS idx_drawer_is_right_section ON Drawer(isRightSection);

        -- Add composite indices for common query patterns
        CREATE INDEX IF NOT EXISTS idx_drawer_size_is_right ON Drawer(size, isRightSection);
        CREATE INDEX IF NOT EXISTS idx_drawer_title_keywords ON Drawer(title, keywords);

        CREATE TABLE IF NOT EXISTS PrinterConfig (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            printerName TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            virtualPrinting INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Add triggers for automatic timestamp updates
        CREATE TRIGGER IF NOT EXISTS drawer_updated_at
        AFTER UPDATE ON Drawer
        BEGIN
            UPDATE Drawer SET updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS printer_config_updated_at
        AFTER UPDATE ON PrinterConfig
        BEGIN
            UPDATE PrinterConfig SET updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;
        END;

        -- Add triggers for data validation
        CREATE TRIGGER IF NOT EXISTS validate_drawer_spacing
        BEFORE INSERT ON Drawer
        BEGIN
            SELECT CASE
                WHEN NEW.spacing < 0 THEN
                    RAISE(ABORT, 'Spacing must be non-negative')
            END;
        END;

        CREATE TRIGGER IF NOT EXISTS validate_printer_port
        BEFORE INSERT ON PrinterConfig
        BEGIN
            SELECT CASE
                WHEN NEW.port < 1 OR NEW.port > 65535 THEN
                    RAISE(ABORT, 'Port must be between 1 and 65535')
            END;
        END;

        -- Add initial printer config if not exists
        INSERT OR IGNORE INTO PrinterConfig (id, printerName, host, port)
        VALUES (1, 'Default Printer', 'localhost', 9100);
    `);
}

export async function down(db: Database): Promise<void> {
    await db.exec(`
        -- Drop triggers first
        DROP TRIGGER IF EXISTS validate_printer_port;
        DROP TRIGGER IF EXISTS validate_drawer_spacing;
        DROP TRIGGER IF EXISTS printer_config_updated_at;
        DROP TRIGGER IF EXISTS drawer_updated_at;

        -- Drop indices
        DROP INDEX IF EXISTS idx_drawer_title_keywords;
        DROP INDEX IF EXISTS idx_drawer_size_is_right;
        DROP INDEX IF EXISTS idx_drawer_is_right_section;
        DROP INDEX IF EXISTS idx_drawer_keywords;
        DROP INDEX IF EXISTS idx_drawer_title;
        DROP INDEX IF EXISTS idx_drawer_size;

        -- Drop tables
        DROP TABLE IF EXISTS PrinterConfig;
        DROP TABLE IF EXISTS Drawer;
        DROP TABLE IF EXISTS schema_migrations;
    `);
} 