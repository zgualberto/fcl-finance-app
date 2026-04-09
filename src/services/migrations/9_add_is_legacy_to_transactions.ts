import type { Migration } from './types';

export const migration: Migration = {
  version: 9,

  description: () => 'Add is_legacy column to transactions table',

  up: async (db) => {
    const columns = (await db.query(`PRAGMA table_info(transactions)`)).values ?? [];
    const hasIsLegacy = columns.some((column) => column.name === 'is_legacy');

    if (hasIsLegacy) {
      return [];
    }

    return [`ALTER TABLE transactions ADD COLUMN is_legacy BOOLEAN DEFAULT 0`];
  },

  down: async (db) => {
    const columns = (await db.query(`PRAGMA table_info(transactions)`)).values ?? [];
    const hasIsLegacy = columns.some((column) => column.name === 'is_legacy');

    if (!hasIsLegacy) {
      return [];
    }

    return [`ALTER TABLE transactions DROP COLUMN is_legacy`];
  },
};
