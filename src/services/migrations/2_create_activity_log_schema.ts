import type { Migration } from './types';

export const migration: Migration = {
  version: 2,

  description: () =>
    'Create activity log schema that will help track user activities and some error reporting',

  up: () => [
    // Accounts table - for storing user's financial accounts
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_error BOOLEAN DEFAULT FALSE
    )`,
  ],

  down: () => [`DROP TABLE IF EXISTS activity_logs`],
};
