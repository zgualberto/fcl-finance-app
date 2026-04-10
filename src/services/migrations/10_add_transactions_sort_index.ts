import type { Migration } from './types';

export const migration: Migration = {
  version: 10,

  description: () => 'Add composite index for transactions sorting by updated_at and id',

  up: () => [
    'CREATE INDEX IF NOT EXISTS idx_transactions_updated_at_id ON transactions(updated_at DESC, id DESC)',
  ],

  down: () => ['DROP INDEX IF EXISTS idx_transactions_updated_at_id'],
};
