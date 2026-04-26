import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as defineJeepSqlite } from 'jeep-sqlite/loader';
import { runMigrations, getMigrationHistory, getCurrentVersion } from './migrations/runner';

const DATABASE_NAME = 'fcl';

type DatabaseConnectionLike = Pick<
  SQLiteDBConnection,
  'isDBOpen' | 'open' | 'close' | 'execute' | 'query' | 'run' | 'exportToJson'
>;

let db: DatabaseConnectionLike | null = null;
let sqlite: SQLiteConnection | null = null;
let initPromise: Promise<void> | null = null;
let webStorePromise: Promise<void> | null = null;
let electronConnection: ElectronDatabaseConnection | null = null;

export interface RestoreVerification {
  rowCounts: {
    members: number;
    categories: number;
    transactions: number;
    activityLogs: number;
    applicationSettings: number;
  };
  integrityOk: boolean;
  migrationVersion: number;
}

type BackupIndex = {
  name?: string;
  value?: string;
};

type BackupTable = {
  name?: string;
  indexes?: BackupIndex[];
};

type BackupPayload = {
  database?: unknown;
  tables?: BackupTable[];
};

function extractResultFlag(result: unknown): boolean {
  if (typeof result === 'boolean') {
    return result;
  }
  if (
    result &&
    typeof result === 'object' &&
    'result' in result &&
    typeof (result as { result?: unknown }).result === 'boolean'
  ) {
    return (result as { result: boolean }).result;
  }
  return false;
}

function sanitizeBackupIndexValue(tableName: string, indexName: string, rawValue: string): string {
  let value = rawValue.trim();

  // Expression indexes are not exported/imported consistently by the Capacitor SQLite JSON format.
  if (tableName === 'categories' && indexName === 'idx_categories_name_lower') {
    return 'name';
  }

  if (value.includes('LOWER(name)')) {
    value = value.replace(/LOWER\(\s*name\s*\)/gi, 'name');
  }

  // Guard malformed payloads where an extra trailing ')' is emitted (e.g., 'name)').
  if (!value.includes('(')) {
    while (value.endsWith(')')) {
      value = value.slice(0, -1).trim();
    }
  }

  return value;
}

function sanitizeBackupPayload(payload: BackupPayload): BackupPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Backup payload is not a valid JSON object');
  }

  payload.database = DATABASE_NAME;

  for (const table of payload.tables ?? []) {
    const tableName = table.name || '';
    for (const index of table.indexes ?? []) {
      if (!index.value || typeof index.value !== 'string') {
        continue;
      }
      const indexName = index.name || '';
      index.value = sanitizeBackupIndexValue(tableName, indexName, index.value);
    }
  }

  return payload;
}

function ensureSQLiteConnectionInstance(): SQLiteConnection {
  if (!sqlite) {
    sqlite = new SQLiteConnection(CapacitorSQLite);
  }
  return sqlite;
}

function isElectronRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return typeof window.electronSQLite !== 'undefined';
}

function getElectronBridge(): ElectronSQLiteBridge {
  if (!window.electronSQLite) {
    throw new Error('Electron SQLite bridge is not available in renderer');
  }

  return window.electronSQLite;
}

class ElectronDatabaseConnection implements DatabaseConnectionLike {
  constructor(private readonly databaseName: string, private readonly bridge: ElectronSQLiteBridge) {}

  async isDBOpen(): Promise<{ result: boolean }> {
    return { result: true };
  }

  async open(): Promise<void> {
    await this.bridge.init(this.databaseName);
  }

  async close(): Promise<void> {
    await this.bridge.close(this.databaseName);
  }

  async execute(statements: string): Promise<{ changes?: { changes?: number } }> {
    return await this.bridge.execute(this.databaseName, statements);
  }

  async query(
    statement: string,
    values: unknown[] = [],
  ): Promise<{ values?: Array<Record<string, unknown>> }> {
    return await this.bridge.query(this.databaseName, statement, values);
  }

  async run(
    statement: string,
    values: unknown[] = [],
  ): Promise<{ changes?: { changes?: number; lastId?: number } }> {
    return await this.bridge.run(this.databaseName, statement, values);
  }

  async exportToJson(
    _jsonexportmode: string,
    _encrypted: boolean,
  ): Promise<{ export?: unknown }> {
    return await this.bridge.exportJson(this.databaseName);
  }
}

async function ensureElectronConnection(): Promise<ElectronDatabaseConnection> {
  const bridge = getElectronBridge();
  await bridge.init(DATABASE_NAME);

  if (!electronConnection) {
    electronConnection = new ElectronDatabaseConnection(DATABASE_NAME, bridge);
  }

  return electronConnection;
}

function usesWebSqliteRuntime(): boolean {
  return Capacitor.getPlatform() === 'web';
}

function ensureJeepSqliteElement(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if (!customElements.get('jeep-sqlite')) {
    defineJeepSqlite(window);
  }

  if (!document.querySelector('jeep-sqlite')) {
    const jeepSqliteElement = document.createElement('jeep-sqlite');
    jeepSqliteElement.setAttribute('style', 'display: none;');
    (document.body ?? document.documentElement).appendChild(jeepSqliteElement);
  }
}

async function prepareWebStore(sqliteConn: SQLiteConnection): Promise<void> {
  if (!usesWebSqliteRuntime() || isElectronRuntime()) {
    return;
  }

  if (!webStorePromise) {
    webStorePromise = (async () => {
      console.log('[Database] Preparing web SQLite store for renderer runtime');
      ensureJeepSqliteElement();
      await sqliteConn.initWebStore();
      console.log('[Database] Web SQLite store ready');
    })();
  }

  await webStorePromise;
}

async function ensureNamedConnection(): Promise<SQLiteDBConnection> {
  if (isElectronRuntime()) {
    return (await ensureElectronConnection()) as unknown as SQLiteDBConnection;
  }

  const sqliteConn = ensureSQLiteConnectionInstance();

  await prepareWebStore(sqliteConn);

  const hasConn = extractResultFlag(await sqliteConn.isConnection(DATABASE_NAME, false));
  if (!hasConn) {
    await sqliteConn.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
  }

  const conn = await sqliteConn.retrieveConnection(DATABASE_NAME, false);
  const isOpen = extractResultFlag(await conn.isDBOpen());
  if (!isOpen) {
    await conn.open();
  }

  return conn;
}

function normalizeBackupJson(jsonData: string): string {
  const parsed = JSON.parse(jsonData) as BackupPayload;
  const sanitized = sanitizeBackupPayload(parsed);
  return JSON.stringify(sanitized);
}

async function closeAndDeleteDatabase(sqliteConn: SQLiteConnection): Promise<void> {
  const hasConn = extractResultFlag(await sqliteConn.isConnection(DATABASE_NAME, false));

  if (hasConn) {
    const existingConn = await sqliteConn.retrieveConnection(DATABASE_NAME, false);
    const isOpen = extractResultFlag(await existingConn.isDBOpen());
    if (isOpen) {
      await existingConn.close();
    }
    await existingConn.delete();
    await sqliteConn.closeConnection(DATABASE_NAME, false);
  }
}

/**
 * Get the SQLite database connection instance
 */
export function getDatabase(): SQLiteDBConnection {
  if (!db) {
    throw new Error('Database not initialized. Make sure sqlite boot file has run.');
  }
  return db as unknown as SQLiteDBConnection;
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
      if (isElectronRuntime()) {
        db = await ensureElectronConnection();
        await db.execute('PRAGMA foreign_keys = ON');

        console.log('[Database] Electron database opened successfully');
        console.log('[Database] Running migrations...');
        await runMigrations(db as SQLiteDBConnection);

        const currentVersion = await getCurrentVersion(db as SQLiteDBConnection);
        console.log('[Database] Database version:', currentVersion);
        return;
      }

      const sqliteConn = ensureSQLiteConnectionInstance();

      await prepareWebStore(sqliteConn);

      try {
        await sqliteConn.checkConnectionsConsistency();
      } catch (error) {
        console.warn('[Database] Connection consistency check failed:', error);
      }

      // Reuse existing connection if available (e.g., HMR or app resume)
      const isConn = await sqliteConn.isConnection(DATABASE_NAME, false);
      let hasConn = typeof isConn === 'boolean' ? isConn : isConn.result;
      if (!hasConn) {
        console.log('[Database] Creating/opening connection to:', DATABASE_NAME);
        try {
          await sqliteConn.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
        } catch (error) {
          if (String(error).includes('already exists')) {
            console.warn('[Database] Connection already exists, reusing:', DATABASE_NAME);
            hasConn = true;
          } else {
            throw error;
          }
        }
      } else {
        console.log('[Database] Reusing existing connection to:', DATABASE_NAME);
      }

      // Retrieve the connection
      db = await sqliteConn.retrieveConnection(DATABASE_NAME, false);

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
      await runMigrations(db as SQLiteDBConnection);

      const currentVersion = await getCurrentVersion(db as SQLiteDBConnection);
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

    const payloadString =
      typeof result.export === 'string' ? result.export : JSON.stringify(result.export);
    return normalizeBackupJson(payloadString);
  } catch (error) {
    console.error('[Database] Export failed:', error);
    throw error;
  }
}

/**
 * Import database from JSON backup
 */
export async function importFromBackup(jsonData: string): Promise<void> {
  const normalizedJsonData = normalizeBackupJson(jsonData);

  try {
    if (isElectronRuntime()) {
      const bridge = getElectronBridge();

      console.log('[Database] Preparing Electron restore: resetting existing database');
      await bridge.reset(DATABASE_NAME);

      console.log('[Database] Importing backup JSON payload to Electron database...');
      await bridge.importJson(DATABASE_NAME, normalizedJsonData);

      db = await ensureElectronConnection();
      await db.execute('PRAGMA foreign_keys = ON');

      console.log('[Database] Running migrations after restore...');
      await runMigrations(db as SQLiteDBConnection);
      const currentVersion = await getCurrentVersion(db as SQLiteDBConnection);
      console.log('[Database] Restore completed. Database version:', currentVersion);

      const verification = await verifyRestoreIntegrity();
      console.log('[Database] Restore verification:', verification);
      console.log('[Database] Database restored from backup');
      return;
    }

    const sqliteConn = ensureSQLiteConnectionInstance();

    console.log('[Database] Preparing restore: closing connection and deleting existing database');
    if (db) {
      try {
        const isOpen = extractResultFlag(await db.isDBOpen());
        if (isOpen) {
          await db.close();
        }
      } catch (error) {
        console.warn('[Database] Failed to close active connection handle before restore:', error);
      } finally {
        db = null;
      }
    }

    await closeAndDeleteDatabase(sqliteConn);

    console.log('[Database] Importing backup JSON payload...');
    await sqliteConn.importFromJson(normalizedJsonData);

    db = await ensureNamedConnection();
    await db.execute('PRAGMA foreign_keys = ON');

    console.log('[Database] Running migrations after restore...');
    await runMigrations(db as SQLiteDBConnection);
    const currentVersion = await getCurrentVersion(db);
    console.log('[Database] Restore completed. Database version:', currentVersion);

    const verification = await verifyRestoreIntegrity();
    console.log('[Database] Restore verification:', verification);

    console.log('[Database] Database restored from backup');
  } catch (error) {
    try {
      db = await ensureNamedConnection();
      await db.execute('PRAGMA foreign_keys = ON');
      await runMigrations(db as SQLiteDBConnection);
      console.warn('[Database] Recovered by reinitializing an empty database after import failure');
    } catch (recoveryError) {
      db = null;
      console.error('[Database] Recovery initialization failed after import error:', recoveryError);
    }
    console.error('[Database] Import failed:', error);
    throw error;
  }
}

/**
 * Build a verification report for the active database.
 */
export async function verifyRestoreIntegrity(): Promise<RestoreVerification> {
  const database = getDatabase();

  const queryCount = async (tableName: string): Promise<number> => {
    const result = await database.query(`SELECT COUNT(*) as total FROM ${tableName}`);
    return Number(result.values?.[0]?.total || 0);
  };

  const integrityResult = await database.query('PRAGMA integrity_check');
  const integrityOk =
    String(integrityResult.values?.[0]?.integrity_check || '').toLowerCase() === 'ok';

  const [members, categories, transactions, activityLogs, applicationSettings, migrationVersion] =
    await Promise.all([
      queryCount('members'),
      queryCount('categories'),
      queryCount('transactions'),
      queryCount('activity_logs'),
      queryCount('application_settings'),
      getCurrentVersion(database),
    ]);

  return {
    rowCounts: {
      members,
      categories,
      transactions,
      activityLogs,
      applicationSettings,
    },
    integrityOk,
    migrationVersion,
  };
}

/**
 * Check database integrity
 */
export async function checkIntegrity(): Promise<boolean | null> {
  try {
    const db = getDatabase();
    const result = await db.query('PRAGMA integrity_check');
    const integrityValue = String(result.values?.[0]?.integrity_check || '')
      .trim()
      .toLowerCase();

    if (!integrityValue) {
      console.warn('[Database] Integrity check returned no result');
      return null;
    }

    if (integrityValue === 'ok') {
      console.log('[Database] Integrity check passed');
      return true;
    }

    console.error('[Database] Integrity check reported corruption:', integrityValue);
    return false;
  } catch (error) {
    console.error('[Database] Integrity check could not be completed:', error);
    return null;
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
      electronConnection = null;
      console.log('[Database] Database closed');
    } catch (error) {
      console.error('[Database] Error closing database:', error);
    }
  }
}
