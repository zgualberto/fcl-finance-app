import type { Migration } from './types';

export const migration: Migration = {
  version: 1,

  description: () => 'Create initial schema with accounts, categories, and transactions tables',

  up: () => [
    // Accounts table - for storing user's financial accounts
    `CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name NVARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Categories table - for transaction categories
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name NVARCHAR(255) NOT NULL UNIQUE,
      is_active BOOLEAN default 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      parent_id INTEGER NULL
    )`,

    // Transactions table - main transaction log
    `CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      category_id INTEGER,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT DEFAULT '',
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )`,

    // Indexes for performance
    `CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name)`,
    `CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)`,
  ],

  down: () => [
    // Drop indexes
    `DROP INDEX IF EXISTS idx_accounts_name`,
    `DROP INDEX IF EXISTS idx_categories_name`,
    `DROP INDEX IF EXISTS idx_transactions_category_id`,
    `DROP INDEX IF EXISTS idx_transactions_date`,
    `DROP INDEX IF EXISTS idx_transactions_account_id`,

    // Drop tables in reverse order (handle foreign keys)
    `DROP TABLE IF EXISTS transactions`,
    `DROP TABLE IF EXISTS categories`,
    `DROP TABLE IF EXISTS accounts`,
  ],
};
