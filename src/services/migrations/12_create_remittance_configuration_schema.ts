import type { Migration } from './types';

export const migration: Migration = {
  version: 12,

  description: () => 'Create remittance configuration schema for managing effective date ranges',

  up: () => [
    `CREATE TABLE IF NOT EXISTS remittance_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE INDEX IF NOT EXISTS idx_remittance_configurations_start_date ON remittance_configurations(start_date)`,
    `CREATE INDEX IF NOT EXISTS idx_remittance_configurations_end_date ON remittance_configurations(end_date)`,
    `CREATE INDEX IF NOT EXISTS idx_remittance_configurations_status ON remittance_configurations(status)`,
  ],

  down: () => [`DROP TABLE IF EXISTS remittance_configurations`],
};
