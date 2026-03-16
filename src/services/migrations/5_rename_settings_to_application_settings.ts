import type { Migration } from './types';

export const migration: Migration = {
  version: 5,

  description: () => 'Rename settings table to application_settings',

  up: async (db) => {
    const hasLegacy =
      (await db.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'`))
        .values?.length ?? 0;
    const hasTarget =
      (
        await db.query(
          `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'application_settings'`,
        )
      ).values?.length ?? 0;

    if (!hasLegacy && !hasTarget) {
      return [
        `CREATE TABLE IF NOT EXISTS application_settings (
          key NVARCHAR(255) PRIMARY KEY,
          value TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
      ];
    }

    if (hasLegacy && !hasTarget) {
      return [`ALTER TABLE "settings" RENAME TO application_settings`];
    }

    if (hasLegacy && hasTarget) {
      return [
        `INSERT OR REPLACE INTO application_settings (key, value, created_at, updated_at)
        SELECT key, value, created_at, updated_at FROM "settings"`,
        `DROP TABLE IF EXISTS "settings"`,
      ];
    }

    return [];
  },

  down: async (db) => {
    const hasLegacy =
      (await db.query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'`))
        .values?.length ?? 0;
    const hasTarget =
      (
        await db.query(
          `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'application_settings'`,
        )
      ).values?.length ?? 0;

    if (!hasLegacy && hasTarget) {
      return [`ALTER TABLE application_settings RENAME TO "settings"`];
    }

    if (hasLegacy && hasTarget) {
      return [
        `INSERT OR REPLACE INTO "settings" (key, value, created_at, updated_at)
        SELECT key, value, created_at, updated_at FROM application_settings`,
        `DROP TABLE IF EXISTS application_settings`,
      ];
    }

    if (!hasLegacy && !hasTarget) {
      return [
        `CREATE TABLE IF NOT EXISTS "settings" (
          key NVARCHAR(255) PRIMARY KEY,
          value TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
      ];
    }

    return [];
  },
};
