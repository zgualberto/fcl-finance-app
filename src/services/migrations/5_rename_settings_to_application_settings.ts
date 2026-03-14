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
      await db.execute(`
        CREATE TABLE IF NOT EXISTS application_settings (
          key NVARCHAR(255) PRIMARY KEY,
          value TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      return;
    }

    if (hasLegacy && !hasTarget) {
      await db.execute(`ALTER TABLE "settings" RENAME TO application_settings`);
      return;
    }

    if (hasLegacy && hasTarget) {
      await db.execute(`
        INSERT OR REPLACE INTO application_settings (key, value, created_at, updated_at)
        SELECT key, value, created_at, updated_at FROM "settings"
      `);
      await db.execute(`DROP TABLE IF EXISTS "settings"`);
    }
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
      await db.execute(`ALTER TABLE application_settings RENAME TO "settings"`);
      return;
    }

    if (hasLegacy && hasTarget) {
      await db.execute(`
        INSERT OR REPLACE INTO "settings" (key, value, created_at, updated_at)
        SELECT key, value, created_at, updated_at FROM application_settings
      `);
      await db.execute(`DROP TABLE IF EXISTS application_settings`);
      return;
    }

    if (!hasLegacy && !hasTarget) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "settings" (
          key NVARCHAR(255) PRIMARY KEY,
          value TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  },
};
