import type { Migration } from './types';
import { ExpenseBudgetSource } from 'src/enums/expense_budget_source';
import { TransactionType } from 'src/enums/transaction_type';

export const migration: Migration = {
  version: 11,

  description: () => 'Add budget_source column to transactions table',

  up: async (db) => {
    const columns = (await db.query(`PRAGMA table_info(transactions)`)).values ?? [];
    const hasBudgetSource = columns.some((column) => column.name === 'budget_source');

    if (!hasBudgetSource) {
      await db.execute(`ALTER TABLE transactions ADD COLUMN budget_source TEXT`);
    }

    await db.execute(`
      UPDATE transactions
      SET budget_source = '${ExpenseBudgetSource.CURRENT_MONTH_COLLECTION}'
      WHERE (budget_source IS NULL OR TRIM(budget_source) = '')
        AND category_id IN (
          SELECT c.id
          FROM categories c
          WHERE c.transaction_type = '${TransactionType.EXPENSES}'
        )
    `);

    await db.execute(`
      UPDATE transactions
      SET budget_source = NULL
      WHERE category_id IN (
        SELECT c.id
        FROM categories c
        WHERE c.transaction_type != '${TransactionType.EXPENSES}' OR c.transaction_type IS NULL
      )
    `);

    return [];
  },

  down: async (db) => {
    const columns = (await db.query(`PRAGMA table_info(transactions)`)).values ?? [];
    const hasBudgetSource = columns.some((column) => column.name === 'budget_source');

    if (!hasBudgetSource) {
      return [];
    }

    return [`ALTER TABLE transactions DROP COLUMN budget_source`];
  },
};
