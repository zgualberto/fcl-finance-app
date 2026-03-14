import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

type MigrationStepResult = string | string[] | void | Promise<string | string[] | void>;

/**
 * Migration interface - similar to Laravel migrations
 * Each migration file should export a migration object with these properties
 */
export interface Migration {
  /**
   * Version number - unique identifier for this migration
   * Must be sequential: 1, 2, 3, etc.
   */
  version: number;

  /**
   * Human-readable description of what this migration does
   * Will be stored in the migrations table for audit trail
   */
  description: () => string;

  /**
   * SQL statements or operations to execute when migrating up
   * Can be SQL statement(s), or run imperative DB logic for conditional migrations
   */
  up: (db: SQLiteDBConnection) => MigrationStepResult;

  /**
   * SQL statements or operations to execute when rolling back
   * Should undo what the up function did
   * Can be SQL statement(s), or run imperative DB logic for conditional rollbacks
   */
  down: (db: SQLiteDBConnection) => MigrationStepResult;
}
