import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { migrations } from './index';

/**
 * Initialize the migrations table
 * This table tracks which migrations have been applied
 */
async function initMigrationsTable(db: SQLiteDBConnection): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      description TEXT NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'completed'
    )
  `);
}

/**
 * Get the list of applied migrations
 */
async function getAppliedMigrations(db: SQLiteDBConnection): Promise<number[]> {
  try {
    const result = await db.query('SELECT version FROM migrations ORDER BY version ASC');
    return (result.values || []).map((row) => row.version as number);
  } catch {
    return [];
  }
}

/**
 * Run pending migrations
 */
export async function runMigrations(db: SQLiteDBConnection): Promise<void> {
  try {
    console.log('[Migrations] Initializing migrations table...');
    await initMigrationsTable(db);

    const appliedVersions = await getAppliedMigrations(db);
    console.log('[Migrations] Applied versions:', appliedVersions);

    // Find pending migrations
    const pending = migrations.filter((m) => !appliedVersions.includes(m.version));

    if (pending.length === 0) {
      console.log('[Migrations] All migrations are up to date');
      return;
    }

    console.log('[Migrations] Running', pending.length, 'pending migration(s)...');

    // Execute pending migrations
    for (const migration of pending) {
      try {
        console.log(`[Migrations] Executing migration ${migration.version}...`);

        // Get the up statements
        const upStatements = migration.up();
        const statements = Array.isArray(upStatements) ? upStatements : [upStatements];

        // Execute each statement (no explicit transactions - SQLite handles commits automatically)
        for (const statement of statements) {
          await db.execute(statement);
        }

        // Record the migration
        const description = migration.description();
        const insertSql = `INSERT INTO migrations (version, description, status) VALUES (${migration.version}, '${description.replace(/'/g, "''")}', 'completed')`;
        await db.execute(insertSql);

        console.log(`[Migrations] Migration ${migration.version} completed: ${description}`);
      } catch (error) {
        console.error(`[Migrations] Migration ${migration.version} failed:`, error);
        throw new Error(
          `Migration ${migration.version} failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    console.log('[Migrations] All pending migrations completed successfully');
  } catch (error) {
    console.error('[Migrations] Migration runner error:', error);
    throw error;
  }
}

/**
 * Get migration history from the database
 */
export async function getMigrationHistory(db: SQLiteDBConnection): Promise<
  Array<{
    version: number;
    description: string;
    executedAt: string;
    status: string;
  }>
> {
  try {
    const result = await db.query(`
      SELECT version, description, executed_at as executedAt, status
      FROM migrations
      ORDER BY version DESC
    `);

    return (result.values || []) as Array<{
      version: number;
      description: string;
      executedAt: string;
      status: string;
    }>;
  } catch (error) {
    console.error('[Migrations] Error getting migration history:', error);
    return [];
  }
}

/**
 * Get the current database version (latest applied migration)
 */
export async function getCurrentVersion(db: SQLiteDBConnection): Promise<number> {
  try {
    const result = await db.query(`SELECT MAX(version) as latestVersion FROM migrations`);
    const latestVersion = (result.values?.[0]?.latestVersion as number) || 0;
    return latestVersion;
  } catch {
    return 0;
  }
}
