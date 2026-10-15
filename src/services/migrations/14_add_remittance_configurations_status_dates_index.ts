import type { Migration } from './types';

export const migration: Migration = {
  version: 14,

  description: () =>
    'Add composite index on remittance configurations for per-date coverage checks',

  up: () => [
    `CREATE INDEX IF NOT EXISTS idx_remittance_configurations_status_dates ON remittance_configurations(status, start_date, end_date)`,
  ],

  down: () => [
    `DROP INDEX IF EXISTS idx_remittance_configurations_status_dates`,
  ],
};
