import type { Migration } from './types';

export const migration: Migration = {
  version: 13,

  description: () => 'Create other offerings field in category table',

  up: () => [`ALTER TABLE categories ADD COLUMN other_offerings BOOLEAN DEFAULT 0`],

  down: () => [`ALTER TABLE categories DROP COLUMN other_offerings`],
};
