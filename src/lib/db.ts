import Database from 'better-sqlite3';
import { logger } from './logger';
import path from 'path';
import { z } from 'zod';

// Validation schemas
export const drawerSchema = z.object({
    id: z.string().min(1),
    size: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
    title: z.string().min(1),
    name: z.string().nullable(),
    positions: z.string(),
    is_right_section: z.boolean(),
    keywords: z.string(),
    spacing: z.number().int().min(0),
    created_at: z.string(),
    updated_at: z.string()
});

export const printerConfigSchema = z.object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
    config: z.string(),
    printer_name: z.string(),
    host: z.string(),
    port: z.number().int().min(1).max(65535),
    virtual_printing: z.boolean(),
    created_at: z.string(),
    updated_at: z.string()
});

export type Drawer = z.infer<typeof drawerSchema>;
export type PrinterConfig = z.infer<typeof printerConfigSchema>;

// Singleton database instance
let dbInstance: Database.Database | null = null;

// Prepared statements type
type PreparedStatements = {
    getAllDrawers: Database.Statement<[]>;
    getDrawer: Database.Statement<[string]>;
    createDrawer: Database.Statement;
    updateDrawer: Database.Statement;
    deleteDrawer: Database.Statement<[string]>;
    getPrinterConfig: Database.Statement<[]>;
    updatePrinterConfig: Database.Statement;
    updateAllDrawers: Database.Statement;
} | null;

let preparedStmts: PreparedStatements = null;

function getDb(): Database.Database {
    if (!dbInstance) {
        const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data/database.db');
        const fs = require('fs');

        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Check if we have write permissions
        try {
            fs.accessSync(dataDir, fs.constants.W_OK);
        } catch (error) {
            logger.error('No write permission to database directory:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('No write permission to database directory');
        }

        // Create database instance with optimized settings
        dbInstance = new Database(dbPath, { 
            fileMustExist: false,
            readonly: false,
            timeout: 2000, // Reduced from 5000ms since this is a small app
            verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
        });

        // Initialize tables with optimized indices
        dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS drawer (
                id TEXT PRIMARY KEY,
                size TEXT NOT NULL CHECK(size IN ('SMALL', 'MEDIUM', 'LARGE')),
                title TEXT NOT NULL,
                name TEXT,
                positions TEXT NOT NULL DEFAULT '',
                is_right_section INTEGER NOT NULL DEFAULT 0 CHECK(is_right_section IN (0,1)),
                keywords TEXT NOT NULL DEFAULT '',
                spacing INTEGER NOT NULL DEFAULT 0 CHECK(spacing >= 0),
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_drawer_created_at ON drawer(created_at);
            CREATE INDEX IF NOT EXISTS idx_drawer_is_right_section ON drawer(is_right_section);

            CREATE TABLE IF NOT EXISTS printer_config (
                id INTEGER PRIMARY KEY DEFAULT 1,
                name TEXT NOT NULL DEFAULT 'Default Printer',
                type TEXT NOT NULL DEFAULT 'IPP',
                config TEXT NOT NULL DEFAULT '',
                printer_name TEXT NOT NULL DEFAULT '',
                host TEXT NOT NULL DEFAULT '',
                port INTEGER NOT NULL DEFAULT 631 CHECK(port BETWEEN 1 AND 65535),
                virtual_printing INTEGER NOT NULL DEFAULT 0 CHECK(virtual_printing IN (0,1)),
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            -- Ensure we always have at least one printer config
            INSERT OR IGNORE INTO printer_config (id) VALUES (1);
        `);

        // Optimize database settings for a small application
        dbInstance.pragma('journal_mode = WAL');
        dbInstance.pragma('synchronous = NORMAL');
        dbInstance.pragma('temp_store = MEMORY');
        dbInstance.pragma('mmap_size = 64MB'); // Reduced from 30GB to 64MB
        dbInstance.pragma('page_size = 4096');
        dbInstance.pragma('cache_size = -512'); // Reduced from 2MB to 512KB
        dbInstance.pragma('busy_timeout = 2000'); // Reduced from 5000ms
    }

    return dbInstance;
}

function prepareStatements(db: Database.Database): NonNullable<PreparedStatements> {
    if (!preparedStmts) {
        preparedStmts = {
            getAllDrawers: db.prepare('SELECT * FROM drawer ORDER BY created_at ASC'),
            getDrawer: db.prepare('SELECT * FROM drawer WHERE id = ?'),
            createDrawer: db.prepare(`
                INSERT INTO drawer (id, size, title, name, positions, is_right_section, keywords, spacing)
                VALUES (@id, @size, @title, @name, @positions, @is_right_section, @keywords, @spacing)
            `),
            updateDrawer: db.prepare(`
                UPDATE drawer 
                SET size = @size, 
                    title = @title, 
                    name = @name, 
                    positions = @positions, 
                    is_right_section = @is_right_section, 
                    keywords = @keywords, 
                    spacing = @spacing,
                    updated_at = datetime('now')
                WHERE id = @id
            `),
            deleteDrawer: db.prepare('DELETE FROM drawer WHERE id = ?'),
            getPrinterConfig: db.prepare('SELECT * FROM printer_config WHERE id = 1'),
            updatePrinterConfig: db.prepare(`
                UPDATE printer_config 
                SET name = @name,
                    type = @type,
                    config = @config,
                    printer_name = @printer_name,
                    host = @host,
                    port = @port,
                    virtual_printing = @virtual_printing,
                    updated_at = datetime('now')
                WHERE id = 1
            `),
            updateAllDrawers: db.prepare(`
                INSERT INTO drawer (id, size, title, name, positions, is_right_section, keywords, spacing)
                VALUES (@id, @size, @title, @name, @positions, @is_right_section, @keywords, @spacing)
            `)
        };
    }
    return preparedStmts;
}

// Database operations with improved error handling and type safety
export function getAllDrawers(): Drawer[] {
    const db = getDb();
    try {
        const stmts = prepareStatements(db);
        if (!stmts) throw new Error('Failed to prepare database statements');
        const drawers = stmts.getAllDrawers.all() as Drawer[];
        return drawers;
    } catch (error) {
        logger.error('Failed to get drawers from database:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export function getDrawer(id: string): Drawer | null {
    const db = getDb();
    try {
        const stmts = prepareStatements(db);
        if (!stmts) throw new Error('Failed to prepare database statements');
        return stmts.getDrawer.get(id) as Drawer | null;
    } catch (error) {
        logger.error(`Failed to get drawer ${id} from database:`, error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export function createDrawer(drawer: Omit<Drawer, 'created_at' | 'updated_at'>): void {
    const db = getDb();
    try {
        const stmts = prepareStatements(db);
        if (!stmts) throw new Error('Failed to prepare database statements');
        const params = {
            ...drawer,
            is_right_section: drawer.is_right_section ? 1 : 0
        };
        stmts.createDrawer.run(params);
    } catch (error) {
        logger.error('Failed to create drawer:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export function updateAllDrawers(drawers: Omit<Drawer, 'created_at' | 'updated_at'>[]): void {
    const db = getDb();
    try {
        const stmts = prepareStatements(db);
        if (!stmts) throw new Error('Failed to prepare database statements');
        const transaction = db.transaction((items) => {
            db.prepare('DELETE FROM drawer').run();
            for (const item of items) {
                const params = {
                    ...item,
                    is_right_section: item.is_right_section ? 1 : 0
                };
                stmts.updateAllDrawers.run(params);
            }
        });

        transaction(drawers);
    } catch (error) {
        logger.error('Failed to update all drawers:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export function getPrinterConfig(): PrinterConfig | null {
    const db = getDb();
    try {
        const stmts = prepareStatements(db);
        if (!stmts) throw new Error('Failed to prepare database statements');
        return stmts.getPrinterConfig.get() as PrinterConfig | null;
    } catch (error) {
        logger.error('Failed to get printer config:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export function updatePrinterConfig(config: Omit<PrinterConfig, 'id' | 'created_at' | 'updated_at'>): void {
    const db = getDb();
    try {
        const stmts = prepareStatements(db);
        if (!stmts) throw new Error('Failed to prepare database statements');
        const params = {
            ...config,
            virtual_printing: config.virtual_printing ? 1 : 0
        };
        stmts.updatePrinterConfig.run(params);
    } catch (error) {
        logger.error('Failed to update printer config:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export function updateDrawer(id: string, updates: Partial<Omit<Drawer, 'id' | 'created_at' | 'updated_at'>>): void {
    const db = getDb();
    try {
        const stmts = prepareStatements(db);
        if (!stmts) throw new Error('Failed to prepare database statements');
        const params = {
            ...updates,
            id,
            is_right_section: updates.is_right_section ? 1 : 0
        };
        stmts.updateDrawer.run(params);
    } catch (error) {
        logger.error('Failed to update drawer:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

export function deleteDrawer(id: string): void {
    const db = getDb();
    try {
        const stmts = prepareStatements(db);
        if (!stmts) throw new Error('Failed to prepare database statements');
        stmts.deleteDrawer.run(id);
    } catch (error) {
        logger.error('Failed to delete drawer:', error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}
