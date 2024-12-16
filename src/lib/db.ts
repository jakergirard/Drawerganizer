import Database from 'better-sqlite3';
import { logger } from './logger';
import path from 'path';

// Types
export interface Drawer {
    id: string;
    size: string;
    title: string;
    name: string | null;
    positions: string;
    is_right_section: boolean;
    keywords: string;
    spacing: number;
    created_at: string;
    updated_at: string;
}

export interface PrinterConfig {
    id: number;
    name: string;
    type: string;
    config: string;
    printer_name: string;
    host: string;
    port: number;
    virtual_printing: boolean;
    created_at: string;
    updated_at: string;
}

// Database initialization
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data/database.db');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS drawer (
    id TEXT PRIMARY KEY,
    size TEXT NOT NULL,
    title TEXT NOT NULL,
    name TEXT,
    positions TEXT NOT NULL DEFAULT '[]',
    is_right_section BOOLEAN NOT NULL DEFAULT FALSE,
    keywords TEXT NOT NULL DEFAULT '[]',
    spacing INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS printer_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT NOT NULL DEFAULT 'Default Printer',
    type TEXT NOT NULL DEFAULT 'IPP',
    config TEXT NOT NULL DEFAULT '',
    printer_name TEXT NOT NULL DEFAULT '',
    host TEXT NOT NULL DEFAULT 'localhost',
    port INTEGER NOT NULL DEFAULT 631,
    virtual_printing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Ensure we always have at least one printer config
  INSERT OR IGNORE INTO printer_config (id) VALUES (1);
`);

// Database operations
export function getAllDrawers(): Drawer[] {
    return db.prepare('SELECT * FROM drawer ORDER BY created_at ASC').all() as Drawer[];
}

export function getDrawer(id: string): Drawer | null {
    return db.prepare('SELECT * FROM drawer WHERE id = ?').get(id) as Drawer | null;
}

export function createDrawer(drawer: Partial<Drawer>): void {
    const params = {
        ...drawer,
        is_right_section: drawer.is_right_section ? 1 : 0
    };

    db.prepare(`
        INSERT INTO drawer (id, size, title, name, positions, is_right_section, keywords, spacing)
        VALUES (@id, @size, @title, @name, @positions, @is_right_section, @keywords, @spacing)
    `).run(params);
}

export function updateDrawer(id: string, updates: Partial<Drawer>): void {
    const fields = Object.keys(updates)
        .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
        .map(key => `${key} = @${key}`)
        .join(', ');
    
    if (!fields) return;

    const params = {
        ...updates,
        id,
        is_right_section: updates.is_right_section ? 1 : 0
    };

    db.prepare(`
        UPDATE drawer 
        SET ${fields}, updated_at = datetime('now')
        WHERE id = @id
    `).run(params);
}

export function deleteDrawer(id: string): void {
    db.prepare('DELETE FROM drawer WHERE id = ?').run(id);
}

export function updateAllDrawers(drawers: Partial<Drawer>[]): void {
    const transaction = db.transaction((items) => {
        db.prepare('DELETE FROM drawer').run();
        const insert = db.prepare(`
            INSERT INTO drawer (id, size, title, name, positions, is_right_section, keywords, spacing)
            VALUES (@id, @size, @title, @name, @positions, @is_right_section, @keywords, @spacing)
        `);
        for (const item of items) {
            const params = {
                ...item,
                is_right_section: item.is_right_section ? 1 : 0
            };
            insert.run(params);
        }
    });

    transaction(drawers);
}

// Printer config operations
export function getPrinterConfig(): PrinterConfig | null {
    return db.prepare('SELECT * FROM printer_config WHERE id = 1').get() as PrinterConfig | null;
}

export function updatePrinterConfig(config: Partial<PrinterConfig>): void {
    const fields = Object.keys(config)
        .filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
        .map(key => `${key} = @${key}`)
        .join(', ');
    
    if (!fields) return;

    const params = {
        ...config,
        virtual_printing: config.virtual_printing ? 1 : 0
    };

    db.prepare(`
        UPDATE printer_config 
        SET ${fields}, updated_at = datetime('now')
        WHERE id = 1
    `).run(params);
}
