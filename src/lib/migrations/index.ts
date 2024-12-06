import { Database } from 'sqlite';
import * as initial from './001_initial_schema';
import { logger } from '../logger';

interface Migration {
    version: number;
    up: (db: Database) => Promise<void>;
    down: (db: Database) => Promise<void>;
}

const migrations: Migration[] = [
    { version: 1, up: initial.up, down: initial.down },
];

export class MigrationError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'MigrationError';
    }
}

async function getCurrentVersion(db: Database): Promise<number> {
    try {
        const result = await db.get<{ version: number }>('SELECT MAX(version) as version FROM schema_migrations');
        return result?.version || 0;
    } catch (error) {
        throw new MigrationError('Failed to get current migration version', error as Error);
    }
}

async function lockMigrations(db: Database): Promise<void> {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS migration_lock (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            locked INTEGER NOT NULL DEFAULT 0,
            locked_at TIMESTAMP
        );
        INSERT OR IGNORE INTO migration_lock (id, locked) VALUES (1, 0);
    `);

    const result = await db.run(`
        UPDATE migration_lock 
        SET locked = 1, locked_at = CURRENT_TIMESTAMP 
        WHERE id = 1 AND locked = 0
    `);

    if (result.changes === 0) {
        throw new MigrationError('Migrations are locked. Another migration might be in progress.');
    }
}

async function unlockMigrations(db: Database): Promise<void> {
    await db.run('UPDATE migration_lock SET locked = 0, locked_at = NULL WHERE id = 1');
}

export async function runMigrations(db: Database): Promise<void> {
    try {
        // Create migrations table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await lockMigrations(db);
        
        try {
            const currentVersion = await getCurrentVersion(db);
            logger.info(`Current database version: ${currentVersion}`);

            // Run pending migrations
            for (const migration of migrations) {
                if (migration.version > currentVersion) {
                    await db.run('BEGIN TRANSACTION');
                    try {
                        logger.info(`Running migration ${migration.version}`);
                        await migration.up(db);
                        await db.run('INSERT INTO schema_migrations (version) VALUES (?)', migration.version);
                        await db.run('COMMIT');
                        logger.info(`Migration ${migration.version} applied successfully`);
                    } catch (error) {
                        await db.run('ROLLBACK');
                        throw new MigrationError(`Failed to apply migration ${migration.version}`, error as Error);
                    }
                }
            }
        } finally {
            await unlockMigrations(db);
        }
    } catch (error) {
        logger.error('Error running migrations', error as Error);
        throw error;
    }
}

export async function rollbackMigration(db: Database): Promise<void> {
    try {
        const currentVersion = await getCurrentVersion(db);
        if (currentVersion === 0) {
            logger.info('No migrations to rollback');
            return;
        }

        await lockMigrations(db);
        
        try {
            const migration = migrations.find(m => m.version === currentVersion);
            if (!migration) {
                throw new MigrationError(`No migration found for version ${currentVersion}`);
            }

            await db.run('BEGIN TRANSACTION');
            try {
                logger.info(`Rolling back migration ${currentVersion}`);
                await migration.down(db);
                await db.run('DELETE FROM schema_migrations WHERE version = ?', currentVersion);
                await db.run('COMMIT');
                logger.info(`Migration ${currentVersion} rolled back successfully`);
            } catch (error) {
                await db.run('ROLLBACK');
                throw new MigrationError(`Failed to rollback migration ${currentVersion}`, error as Error);
            }
        } finally {
            await unlockMigrations(db);
        }
    } catch (error) {
        logger.error('Error rolling back migration', error as Error);
        throw error;
    }
}

export async function rollbackAllMigrations(db: Database): Promise<void> {
    try {
        await lockMigrations(db);
        
        try {
            while (await getCurrentVersion(db) > 0) {
                await rollbackMigration(db);
            }
        } finally {
            await unlockMigrations(db);
        }
    } catch (error) {
        logger.error('Error rolling back all migrations', error as Error);
        throw error;
    }
} 