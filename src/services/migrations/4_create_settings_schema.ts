import type { Migration } from './types';

export const migration: Migration = {
  version: 4,

  description: () => 'Create settings schema for key-value configuration',

  up: () => [
    `CREATE TABLE IF NOT EXISTS "settings" (
      key NVARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ],

  down: () => [`DROP TABLE IF EXISTS "settings"`],
};
