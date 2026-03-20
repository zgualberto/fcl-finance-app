import type { Migration } from './types';

export const migration: Migration = {
  version: 6,

  description: () =>
    'Add performance indexes on categories(parent_id), categories(LOWER(name)), categories(transaction_type), transactions(date, category_id), and activity_logs(created_at)',

  up: () => [
    `CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_categories_name_lower ON categories(LOWER(name))`,
    `CREATE INDEX IF NOT EXISTS idx_categories_transaction_type ON categories(transaction_type)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_date_category_id ON transactions(date, category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)`,
  ],

  down: () => [
    `DROP INDEX IF EXISTS idx_categories_parent_id`,
    `DROP INDEX IF EXISTS idx_categories_name_lower`,
    `DROP INDEX IF EXISTS idx_categories_transaction_type`,
    `DROP INDEX IF EXISTS idx_transactions_date_category_id`,
    `DROP INDEX IF EXISTS idx_activity_logs_created_at`,
  ],
};
