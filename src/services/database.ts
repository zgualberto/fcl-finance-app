import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { runMigrations, getMigrationHistory, getCurrentVersion } from './migrations/runner';

const DATABASE_NAME = 'fcl';

let db: SQLiteDBConnection | null = null;
let sqlite: SQLiteConnection | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Get the SQLite database connection instance
 */
export function getDatabase(): SQLiteDBConnection {
  if (!db) {
    throw new Error('Database not initialized. Make sure sqlite boot file has run.');
  }
  return db;
}

/**
 * Initialize the SQLite database with schema and migrations
 */
export async function initializeDatabase(): Promise<void> {
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      if (!sqlite) {
        sqlite = new SQLiteConnection(CapacitorSQLite);
      }

      // Reuse existing connection if available (e.g., HMR or app resume)
      const isConn = await sqlite.isConnection(DATABASE_NAME, false);
      const hasConn = typeof isConn === 'boolean' ? isConn : isConn.result;
      if (!hasConn) {
        console.log('[Database] Creating/opening connection to:', DATABASE_NAME);
        await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
      } else {
        console.log('[Database] Reusing existing connection to:', DATABASE_NAME);
      }

      // Retrieve the connection
      db = await sqlite.retrieveConnection(DATABASE_NAME, false);

      if (!db) {
        throw new Error('Failed to retrieve database connection');
      }

      // Open database if not already open
      const isOpen = await db.isDBOpen();
      const openResult = typeof isOpen === 'boolean' ? isOpen : isOpen.result;
      if (!openResult) {
        await db.open();
      }

      // Enable foreign keys enforcement
      await db.execute('PRAGMA foreign_keys = ON');

      console.log('[Database] Database opened successfully');

      // Run any pending migrations
      console.log('[Database] Running migrations...');
      await runMigrations(db);

      const currentVersion = await getCurrentVersion(db);
      console.log('[Database] Database version:', currentVersion);
    } catch (error) {
      console.error('[Database] Initialization error:', error);
      throw error;
    }
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * Execute a query and return results
 */
export async function query<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = getDatabase();
  const result = await db.query(sql, params);
  return (result.values || []) as T[];
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE) and return affected rows
 */
export async function run(
  sql: string,
  params: unknown[] = [],
): Promise<{ changes: number; lastId?: number }> {
  const db = getDatabase();
  const result = await db.run(sql, params);
  const lastId = result.changes?.lastId;
  return {
    changes: result.changes?.changes || 0,
    ...(lastId !== undefined && { lastId }),
  };
}

/**
 * Begin a database transaction
 */
export async function beginTransaction(): Promise<void> {
  const db = getDatabase();
  await db.execute('BEGIN TRANSACTION');
}

/**
 * Commit a database transaction
 */
export async function commitTransaction(): Promise<void> {
  const db = getDatabase();
  await db.execute('COMMIT');
}

/**
 * Rollback a database transaction
 */
export async function rollbackTransaction(): Promise<void> {
  const db = getDatabase();
  await db.execute('ROLLBACK');
}

/**
 * Export database to JSON for backup purposes
 */
export async function exportForBackup(): Promise<string> {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = await db.exportToJson('full', false);

    if (!result.export) {
      throw new Error('Failed to export database');
    }

    return typeof result.export === 'string' ? result.export : JSON.stringify(result.export);
  } catch (error) {
    console.error('[Database] Export failed:', error);
    throw error;
  }
}

/**
 * Import database from JSON backup
 */
export async function importFromBackup(jsonData: string): Promise<void> {
  try {
    if (!sqlite) throw new Error('SQLite not initialized');

    // Close existing connection if open
    if (db) {
      await db.close();
    }

    // Delete existing database first by importing (which replaces it)
    // The SQLiteConnection.importFromJson replaces the entire database
    await sqlite.importFromJson(jsonData);

    // Re-establish connection
    db = await sqlite.retrieveConnection(DATABASE_NAME, false);
    if (db) {
      await db.open();
    }

    console.log('[Database] Database restored from backup');
  } catch (error) {
    console.error('[Database] Import failed:', error);
    throw error;
  }
}

/**
 * Check database integrity
 */
export async function checkIntegrity(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db.execute('PRAGMA integrity_check');
    console.log('[Database] Integrity check passed');
    return true;
  } catch (error) {
    console.error('[Database] Integrity check failed:', error);
    return false;
  }
}

/**
 * Get the current database version (latest applied migration)
 */
export async function getDatabaseVersion(): Promise<number> {
  return await getCurrentVersion(getDatabase());
}

/**
 * Get migration history
 */
export async function getMigrations(): Promise<
  Array<{
    version: number;
    description: string;
    executedAt: string;
    status: string;
  }>
> {
  return await getMigrationHistory(getDatabase());
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      await db.close();
      db = null;
      sqlite = null;
      console.log('[Database] Database closed');
    } catch (error) {
      console.error('[Database] Error closing database:', error);
    }
  }
}
