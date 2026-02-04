import type { Migration } from './types';

export const migration: Migration = {
  version: 3,

  description: () => 'Remove updated_at in activity logs table',

  up: () => [
    // Accounts table - for storing user's financial accounts
    `ALTER TABLE activity_logs DROP COLUMN updated_at`,
  ],

  down: () => [`ALTER TABLE activity_logs ADD COLUMN updated_at TIMESTAMP DEFAULT`],
};
