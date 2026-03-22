import type { Migration } from './types';

export const migration: Migration = {
  version: 7,

  description: () => 'Add non_remittable column to categories table',

  up: async (db) => {
    const columns = (await db.query(`PRAGMA table_info(categories)`)).values ?? [];
    const hasNonRemittable = columns.some((column) => column.name === 'non_remittable');

    if (hasNonRemittable) {
      return [];
    }

    return [`ALTER TABLE categories ADD COLUMN non_remittable BOOLEAN DEFAULT 0`];
  },

  down: async (db) => {
    const columns = (await db.query(`PRAGMA table_info(categories)`)).values ?? [];
    const hasNonRemittable = columns.some((column) => column.name === 'non_remittable');

    if (!hasNonRemittable) {
      return [];
    }

    return [`ALTER TABLE categories DROP COLUMN non_remittable`];
  },
};
