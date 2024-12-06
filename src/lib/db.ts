import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { config } from './config';
import { runMigrations } from './migrations';
import { validateDrawerInput, validatePartialDrawerInput, validatePrinterConfigInput, validatePartialPrinterConfigInput } from './validation';
import { logger } from './logger';

// Types
export interface BaseModel {
    created_at: string;
    updated_at: string;
}

export interface Drawer extends BaseModel {
    id: string;
    size: string;
    title: string;
    name: string | null;
    positions: string;
    isRightSection: boolean;
    keywords: string;
    spacing: number;
}

export interface PrinterConfig extends BaseModel {
    id: number;
    printerName: string;
    host: string;
    port: number;
    virtualPrinting: boolean;
}

// Add this before the connection pool configuration
export class DatabaseError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'DatabaseError';
    }
}

// Database configuration
const DB_CONFIG = {
    filename: config.database.url,
    driver: sqlite3.Database
} as const;

// Connection pool configuration
const MAX_CONNECTIONS = 10;
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

interface PoolConnection {
    db: Database;
    inUse: boolean;
    lastUsed: number;
}

class ConnectionPool {
    private static instance: ConnectionPool;
    private pool: PoolConnection[] = [];
    private initPromise: Promise<void> | null = null;

    private constructor() {}

    public static getInstance(): ConnectionPool {
        if (!ConnectionPool.instance) {
            ConnectionPool.instance = new ConnectionPool();
        }
        return ConnectionPool.instance;
    }

    private async initialize(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = this.createInitialConnections();
        }
        return this.initPromise;
    }

    private async createInitialConnections(): Promise<void> {
        try {
            // Create initial connections
            const initialConnections = Math.ceil(MAX_CONNECTIONS / 2);
            for (let i = 0; i < initialConnections; i++) {
                const db = await this.createConnection();
                this.pool.push({ db, inUse: false, lastUsed: Date.now() });
            }
            logger.info(`Created ${initialConnections} initial database connections`);

            // Start cleanup interval
            setInterval(() => this.cleanup(), 60000); // Run cleanup every minute
        } catch (error) {
            logger.error('Failed to create initial connections', error as Error);
            throw error;
        }
    }

    private async createConnection(): Promise<Database> {
        const db = await open(DB_CONFIG);
        await db.exec('PRAGMA journal_mode = WAL');
        await db.exec('PRAGMA busy_timeout = 5000');
        return db;
    }

    private async cleanup(): Promise<void> {
        const now = Date.now();
        const staleTimeout = 5 * 60 * 1000; // 5 minutes

        for (let i = this.pool.length - 1; i >= 0; i--) {
            const conn = this.pool[i];
            if (!conn.inUse && now - conn.lastUsed > staleTimeout && this.pool.length > Math.ceil(MAX_CONNECTIONS / 2)) {
                try {
                    await conn.db.close();
                    this.pool.splice(i, 1);
                    logger.debug('Closed stale database connection');
                } catch (error) {
                    logger.error('Error closing stale connection', error as Error);
                }
            }
        }
    }

    public async getConnection(): Promise<Database> {
        await this.initialize();

        // Find available connection
        let conn = this.pool.find(c => !c.inUse);

        // Create new connection if needed
        if (!conn && this.pool.length < MAX_CONNECTIONS) {
            const db = await this.createConnection();
            conn = { db, inUse: false, lastUsed: Date.now() };
            this.pool.push(conn);
            logger.debug('Created new database connection');
        }

        // Wait for available connection
        if (!conn) {
            logger.warn('All database connections in use, waiting for available connection');
            const startTime = Date.now();
            while (!conn && Date.now() - startTime < CONNECTION_TIMEOUT) {
                await new Promise(resolve => setTimeout(resolve, 100));
                conn = this.pool.find(c => !c.inUse);
            }
            if (!conn) {
                throw new Error('Could not acquire database connection');
            }
        }

        conn.inUse = true;
        conn.lastUsed = Date.now();
        return conn.db;
    }

    public releaseConnection(db: Database): void {
        const conn = this.pool.find(c => c.db === db);
        if (conn) {
            conn.inUse = false;
            conn.lastUsed = Date.now();
        }
    }

    public async closeAll(): Promise<void> {
        for (const conn of this.pool) {
            try {
                await conn.db.close();
            } catch (error) {
                logger.error('Error closing database connection', error as Error);
            }
        }
        this.pool = [];
        this.initPromise = null;
        logger.info('Closed all database connections');
    }
}

// Initialize connection pool
const connectionPool = ConnectionPool.getInstance();

// Helper function for retrying operations
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            if (attempt < RETRY_ATTEMPTS) {
                logger.warn(`Operation failed, retrying (${attempt}/${RETRY_ATTEMPTS})`, { error });
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
            }
        }
    }
    throw lastError;
}

// Database operations with connection pooling and retries
export async function getAllDrawers(): Promise<Drawer[]> {
    return withRetry(async () => {
        const db = await connectionPool.getConnection();
        try {
            logger.debug('Fetching all drawers');
            const drawers = await db.all<Drawer[]>('SELECT * FROM Drawer ORDER BY id');
            logger.debug(`Retrieved ${drawers.length} drawers`);
            return drawers;
        } catch (error) {
            logger.error('Failed to fetch drawers', error as Error);
            throw new DatabaseError('Failed to fetch drawers', error as Error);
        } finally {
            connectionPool.releaseConnection(db);
        }
    });
}

// Add before the cleanup function
export async function getPrinterConfig(): Promise<PrinterConfig | undefined> {
    return withRetry(async () => {
        const db = await connectionPool.getConnection();
        try {
            logger.debug('Fetching printer config');
            const config = await db.get<PrinterConfig>('SELECT * FROM PrinterConfig WHERE id = 1');
            logger.debug(config ? 'Printer config found' : 'Printer config not found');
            return config;
        } catch (error) {
            logger.error('Failed to fetch printer configuration', error as Error);
            throw new DatabaseError('Failed to fetch printer configuration', error as Error);
        } finally {
            connectionPool.releaseConnection(db);
        }
    });
}

export async function updatePrinterConfig(config: Partial<Omit<PrinterConfig, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    return withRetry(async () => {
        const db = await connectionPool.getConnection();
        try {
            logger.debug('Updating printer config', { updates: config });
            const entries = Object.entries(config);
            
            if (entries.length === 0) return;
            
            const sets = entries.map(([key]) => `${key} = ?`).join(', ');
            const values = entries.map(([, value]) => 
                typeof value === 'boolean' ? (value ? 1 : 0) : value
            );
            
            await db.run(`UPDATE PrinterConfig SET ${sets} WHERE id = 1`, values);
            logger.info('Printer config updated successfully');
        } catch (error) {
            logger.error('Failed to update printer configuration', error as Error);
            throw new DatabaseError('Failed to update printer configuration', error as Error);
        } finally {
            connectionPool.releaseConnection(db);
        }
    });
}

// Cleanup function for application shutdown
export async function cleanup(): Promise<void> {
    await connectionPool.closeAll();
}

export async function createDrawer(drawer: Omit<Drawer, 'created_at' | 'updated_at'>): Promise<void> {
    return withRetry(async () => {
        const db = await connectionPool.getConnection();
        try {
            await db.run(
                'INSERT INTO Drawer (id, size, title, name, positions, isRightSection, keywords, spacing) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [drawer.id, drawer.size, drawer.title, drawer.name, drawer.positions, drawer.isRightSection ? 1 : 0, drawer.keywords, drawer.spacing]
            );
        } finally {
            connectionPool.releaseConnection(db);
        }
    });
}

export async function deleteDrawer(id: string): Promise<void> {
    return withRetry(async () => {
        const db = await connectionPool.getConnection();
        try {
            await db.run('DELETE FROM Drawer WHERE id = ?', [id]);
        } finally {
            connectionPool.releaseConnection(db);
        }
    });
}

export const getDb = () => connectionPool.getConnection();

export async function getDrawer(id: string): Promise<Drawer | undefined> {
    return withRetry(async () => {
        const db = await connectionPool.getConnection();
        try {
            return await db.get<Drawer>('SELECT * FROM Drawer WHERE id = ?', [id]);
        } finally {
            connectionPool.releaseConnection(db);
        }
    });
}

export async function updateDrawer(id: string, drawer: Partial<Omit<Drawer, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    return withRetry(async () => {
        const db = await connectionPool.getConnection();
        try {
            const entries = Object.entries(drawer);
            if (entries.length === 0) return;
            
            const sets = entries.map(([key]) => `${key} = ?`).join(', ');
            const values = entries.map(([, value]) => 
                typeof value === 'boolean' ? (value ? 1 : 0) : value
            );
            
            await db.run(`UPDATE Drawer SET ${sets} WHERE id = ?`, [...values, id]);
        } finally {
            connectionPool.releaseConnection(db);
        }
    });
}
