import type { Migration } from './types';

export const migration: Migration = {
  version: 8,

  description: () => 'Add effective date field to categories table',

  up: async (db) => {
    const columns = (await db.query(`PRAGMA table_info(categories)`)).values ?? [];
    const hasEffectiveDate = columns.some((column) => column.name === 'effective_date');

    if (hasEffectiveDate) {
      return [];
    }

    return [`ALTER TABLE categories ADD COLUMN effective_date DATE NULLABLE`];
  },

  down: async (db) => {
    const columns = (await db.query(`PRAGMA table_info(categories)`)).values ?? [];
    const hasEffectiveDate = columns.some((column) => column.name === 'effective_date');

    if (!hasEffectiveDate) {
      return [];
    }

    return [`ALTER TABLE categories DROP COLUMN effective_date`];
  },
};
