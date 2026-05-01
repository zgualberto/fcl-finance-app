import type { Transaction } from '../entities/transaction';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';
import { ExpenseBudgetSource } from 'src/enums/expense_budget_source';
import { TransactionType } from 'src/enums/transaction_type';

const database = getDatabase();

export class TransactionRepository implements BaseRepository<Transaction> {
  private normalizePositiveInteger(value: unknown, fallback: number): number {
    const normalized = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : fallback;
  }

  private resolveDateFilterColumn(dateField: 'date' | 'created_at' | 'updated_at'): string {
    switch (dateField) {
      case 'created_at':
        return 'date(t.created_at)';
      case 'updated_at':
        return 'date(t.updated_at)';
      case 'date':
      default:
        return 'date(t.date)';
    }
  }

  private buildInsertParams(transaction: Partial<Transaction>): Array<number | string | null> {
    return [
      transaction.member_id ?? null,
      transaction.category_id ?? null,
      transaction.amount ?? 0,
      transaction.description ?? '',
      transaction.date ?? '',
      transaction.is_legacy ?? 0,
      transaction.budget_source ?? null,
    ];
  }

  async insert(transaction: Partial<Transaction>): Promise<number> {
    const result = await database.run(
      `INSERT INTO transactions (member_id, category_id, amount, description, date, is_legacy, budget_source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
        .replace(/\s+/g, ' ')
        .trim(),
      this.buildInsertParams(transaction),
    );
    return result.changes?.lastId ?? 0;
  }

  async findAll(): Promise<Transaction[]> {
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.is_legacy,
         t.budget_source,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type AS transaction_type,
         c.non_remittable AS non_remittable,
         c.effective_date AS effective_date,
         c.parent_id,
         pc.name AS parent_name,
         m.name AS member_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN categories pc ON pc.id = c.parent_id
       LEFT JOIN members m ON m.id = t.member_id
      ORDER BY t.updated_at DESC, t.id DESC`,
    );
    return res.values as Transaction[];
  }

  update(transaction: Partial<Transaction>): void {
    void database.run(
      `UPDATE transactions SET
         member_id = ?,
         category_id = ?,
         amount = ?,
         description = ?,
         date = ?,
         is_legacy = ?,
         budget_source = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        transaction.member_id ?? null,
        transaction.category_id ?? null,
        transaction.amount,
        transaction.description ?? '',
        transaction.date,
        transaction.is_legacy ?? 0,
        transaction.budget_source ?? null,
        transaction.id,
      ],
    );
  }

  delete(id: number): void {
    void database.run(`DELETE FROM transactions WHERE id = ?`, [id]);
  }

  async deleteByDate(date: string): Promise<void> {
    await database.run(`DELETE FROM transactions WHERE date = ?`, [date]);
  }

  async replaceByDate(
    date: string,
    transactionType: TransactionType,
    transactions: Partial<Transaction>[],
  ): Promise<void> {
    const statements = [
      {
        statement: `DELETE FROM transactions
          WHERE date = ?
            AND category_id IN (
              SELECT id FROM categories WHERE transaction_type = ?
            )`
          .replace(/\s+/g, ' ')
          .trim(),
        values: [date, transactionType],
      },
      ...transactions.map((transaction) => ({
        statement:
          `INSERT INTO transactions (member_id, category_id, amount, description, date, is_legacy, budget_source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
            .replace(/\s+/g, ' ')
            .trim(),
        values: this.buildInsertParams(transaction),
      })),
    ];

    await database.executeSet(statements, true, 'no');
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.is_legacy,
         t.budget_source,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type AS transaction_type,
         c.non_remittable AS non_remittable,
         c.effective_date AS effective_date,
         c.parent_id,
         COALESCE(pc.name, c.name) AS parent_name,
         m.name AS member_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN categories pc ON pc.id = c.parent_id
       LEFT JOIN members m ON m.id = t.member_id
       WHERE t.date >= ? AND t.date <= ?
      ORDER BY t.updated_at DESC, t.id DESC`,
      [startDate, endDate],
    );
    return res.values as Transaction[];
  }

  async findDistinctCollectionDates(transactionType?: TransactionType): Promise<string[]> {
    let query = `SELECT DISTINCT t.date
       FROM transactions t`;
    const params: string[] = [];

    if (transactionType !== undefined) {
      query += `
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE c.transaction_type = ?`;
      params.push(transactionType);
    }

    query += `
       ORDER BY t.date DESC`;

    const res = await database.query(query, params);
    const dates = res.values as Array<{ date: string }>;
    return dates.map((row) => row.date);
  }

  async findDistinctCollectionDatesPaginated(
    transactionType?: TransactionType,
    page: number = 1,
    limit: number = 25,
    searchTerm?: string,
  ): Promise<string[]> {
    const offset = (page - 1) * limit;
    let query = `SELECT DISTINCT t.date
       FROM transactions t`;
    const params: Array<string | number> = [];
    const filters: string[] = [];

    if (transactionType !== undefined) {
      query += `
       LEFT JOIN categories c ON c.id = t.category_id`;
      filters.push('c.transaction_type = ?');
      params.push(transactionType);
    }

    if (searchTerm?.trim()) {
      filters.push('t.date LIKE ?');
      params.push(`%${searchTerm.trim()}%`);
    }

    if (filters.length > 0) {
      query += `
       WHERE ${filters.join(' AND ')}`;
    }

    query += `
       ORDER BY t.date DESC
       LIMIT ? OFFSET ?`;

    params.push(limit, offset);

    const res = await database.query(query, params);
    const dates = res.values as Array<{ date: string }>;
    return dates.map((row) => row.date);
  }

  async countDistinctCollectionDates(
    transactionType?: TransactionType,
    searchTerm?: string,
  ): Promise<number> {
    let query = `SELECT COUNT(DISTINCT t.date) AS count
       FROM transactions t`;
    const params: string[] = [];
    const filters: string[] = [];

    if (transactionType !== undefined) {
      query += `
       LEFT JOIN categories c ON c.id = t.category_id`;
      filters.push('c.transaction_type = ?');
      params.push(transactionType);
    }

    if (searchTerm?.trim()) {
      filters.push('t.date LIKE ?');
      params.push(`%${searchTerm.trim()}%`);
    }

    if (filters.length > 0) {
      query += `
       WHERE ${filters.join(' AND ')}`;
    }

    const res = await database.query(query, params);
    return (res.values?.[0]?.count as number) ?? 0;
  }

  async findByCollectionDate(
    date: string,
    transactionType?: TransactionType,
  ): Promise<Transaction[]> {
    let query = `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.is_legacy,
         t.budget_source,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type AS transaction_type,
         c.non_remittable AS non_remittable,
         c.effective_date AS effective_date,
         c.parent_id,
         pc.name AS parent_name,
         m.name AS member_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN categories pc ON pc.id = c.parent_id
       LEFT JOIN members m ON m.id = t.member_id
       WHERE t.date = ?`;

    const params: string[] = [date];

    if (transactionType !== undefined) {
      query += ` AND c.transaction_type = ?`;
      params.push(transactionType);
    }

    query += ` ORDER BY t.created_at ASC`;

    const res = await database.query(query, params);
    return res.values as Transaction[];
  }

  async findAllPaginated(page: number = 1, limit: number = 20): Promise<Transaction[]> {
    const offset = (page - 1) * limit;
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.is_legacy,
         t.budget_source,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type AS transaction_type,
         c.non_remittable AS non_remittable,
         c.effective_date AS effective_date,
         c.parent_id,
         pc.name AS parent_name,
         m.name AS member_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN categories pc ON pc.id = c.parent_id
       LEFT JOIN members m ON m.id = t.member_id
      ORDER BY t.updated_at DESC, t.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return res.values as Transaction[];
  }

  async countAll(): Promise<number> {
    const res = await database.query('SELECT COUNT(*) AS count FROM transactions');
    return (res.values?.[0]?.count as number) ?? 0;
  }

  async getYtdSummaryTotals(
    startDate: string,
    endDate: string,
  ): Promise<{
    collections: number;
    legacyCollections: number;
    normalCollections: number;
    expenses: number;
    remittableExpenses: number;
    nonRemittableExpenses: number;
    centralFundExpenses: number;
  }> {
    const res = await database.query(
      `SELECT
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND t.is_legacy = 1
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS legacyCollections,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND (t.is_legacy IS NULL OR t.is_legacy != 1)
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS normalCollections,
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) AS collections,
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) AS expenses,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND (t.budget_source IS NULL OR t.budget_source != ?)
                 AND (
                   c.non_remittable IS NULL
                   OR c.non_remittable != 1
                   OR (c.effective_date IS NOT NULL AND c.effective_date > t.date)
                 )
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS remittableExpenses,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND t.budget_source = ?
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS centralFundExpenses,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND c.non_remittable = 1
                 AND (c.effective_date IS NULL OR c.effective_date <= t.date)
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS nonRemittableExpenses
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.date >= ? AND t.date <= ?`,
      [
        TransactionType.COLLECTIONS,
        TransactionType.COLLECTIONS,
        TransactionType.COLLECTIONS,
        TransactionType.EXPENSES,
        TransactionType.EXPENSES,
        ExpenseBudgetSource.CENTRAL_FUND,
        TransactionType.EXPENSES,
        ExpenseBudgetSource.CENTRAL_FUND,
        TransactionType.EXPENSES,
        startDate,
        endDate,
      ],
    );

    return {
      collections: (res.values?.[0]?.collections as number) ?? 0,
      legacyCollections: (res.values?.[0]?.legacyCollections as number) ?? 0,
      normalCollections: (res.values?.[0]?.normalCollections as number) ?? 0,
      expenses: (res.values?.[0]?.expenses as number) ?? 0,
      remittableExpenses: (res.values?.[0]?.remittableExpenses as number) ?? 0,
      nonRemittableExpenses: (res.values?.[0]?.nonRemittableExpenses as number) ?? 0,
      centralFundExpenses: (res.values?.[0]?.centralFundExpenses as number) ?? 0,
    };
  }

  async findYtdByDatePaginated(
    startDate: string,
    endDate: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<
    Array<{
      date: string;
      collection: number;
      legacyCollection: number;
      normalCollection: number;
      expenses: number;
      remittableExpenses: number;
      nonRemittableExpenses: number;
      centralFundExpenses: number;
    }>
  > {
    const offset = (page - 1) * limit;

    const res = await database.query(
      `SELECT
         t.date AS date,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND t.is_legacy = 1
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS legacyCollection,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND (t.is_legacy IS NULL OR t.is_legacy != 1)
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS normalCollection,
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) AS collection,
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) AS expenses,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND (t.budget_source IS NULL OR t.budget_source != ?)
                 AND (
                   c.non_remittable IS NULL
                   OR c.non_remittable != 1
                   OR (c.effective_date IS NOT NULL AND c.effective_date > t.date)
                 )
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS remittableExpenses,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND t.budget_source = ?
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS centralFundExpenses,
         COALESCE(
           SUM(
             CASE
               WHEN c.transaction_type = ?
                 AND c.non_remittable = 1
                 AND (c.effective_date IS NULL OR c.effective_date <= t.date)
               THEN t.amount
               ELSE 0
             END
           ),
           0
         ) AS nonRemittableExpenses
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.date >= ? AND t.date <= ?
       GROUP BY t.date
       HAVING
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) > 0
         OR COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) > 0
       ORDER BY t.date DESC
       LIMIT ? OFFSET ?`,
      [
        TransactionType.COLLECTIONS,
        TransactionType.COLLECTIONS,
        TransactionType.COLLECTIONS,
        TransactionType.EXPENSES,
        TransactionType.EXPENSES,
        ExpenseBudgetSource.CENTRAL_FUND,
        TransactionType.EXPENSES,
        ExpenseBudgetSource.CENTRAL_FUND,
        TransactionType.EXPENSES,
        startDate,
        endDate,
        TransactionType.COLLECTIONS,
        TransactionType.EXPENSES,
        limit,
        offset,
      ],
    );

    return (
      (res.values as Array<{
        date: string;
        collection: number;
        legacyCollection: number;
        normalCollection: number;
        expenses: number;
        remittableExpenses: number;
        nonRemittableExpenses: number;
        centralFundExpenses: number;
      }>) ?? []
    );
  }

  async countYtdDates(startDate: string, endDate: string): Promise<number> {
    const res = await database.query(
      `SELECT COUNT(*) AS count
       FROM (
         SELECT t.date
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         WHERE t.date >= ? AND t.date <= ?
         GROUP BY t.date
         HAVING
           COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) > 0
           OR COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) > 0
       ) ytd_dates`,
      [startDate, endDate, TransactionType.COLLECTIONS, TransactionType.EXPENSES],
    );

    return (res.values?.[0]?.count as number) ?? 0;
  }

  async searchByKeyword(
    keyword: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<Transaction[]> {
    const offset = (page - 1) * limit;
    const pattern = `%${keyword.toLowerCase()}%`;
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.is_legacy,
         t.budget_source,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type AS transaction_type,
         c.non_remittable AS non_remittable,
         c.effective_date AS effective_date,
         c.parent_id,
         pc.name AS parent_name,
         m.name AS member_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN categories pc ON pc.id = c.parent_id
       LEFT JOIN members m ON m.id = t.member_id
       WHERE LOWER(t.description) LIKE ?
         OR LOWER(COALESCE(c.name, '')) LIKE ?
         OR LOWER(COALESCE(m.name, '')) LIKE ?
         OR LOWER(COALESCE(pc.name, '')) LIKE ?
       ORDER BY t.updated_at DESC, t.id DESC
       LIMIT ? OFFSET ?`,
      [pattern, pattern, pattern, pattern, limit, offset],
    );
    return res.values as Transaction[];
  }

  async countSearchResults(keyword: string): Promise<number> {
    const pattern = `%${keyword.toLowerCase()}%`;
    const res = await database.query(
      `SELECT COUNT(*) AS count
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN categories pc ON pc.id = c.parent_id
       LEFT JOIN members m ON m.id = t.member_id
       WHERE LOWER(t.description) LIKE ?
         OR LOWER(COALESCE(c.name, '')) LIKE ?
         OR LOWER(COALESCE(m.name, '')) LIKE ?
         OR LOWER(COALESCE(pc.name, '')) LIKE ?`,
      [pattern, pattern, pattern, pattern],
    );
    return (res.values?.[0]?.count as number) ?? 0;
  }

  async findByDateRangePaginated(
    startDate: string,
    endDate: string,
    dateField: 'date' | 'created_at' | 'updated_at' = 'date',
    page: number = 1,
    limit: number = 20,
  ): Promise<Transaction[]> {
    const normalizedPage = this.normalizePositiveInteger(page, 1);
    const normalizedLimit = this.normalizePositiveInteger(limit, 20);
    const offset = (normalizedPage - 1) * normalizedLimit;
    const dateFilterColumn = this.resolveDateFilterColumn(dateField);
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.is_legacy,
         t.budget_source,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type AS transaction_type,
         c.non_remittable AS non_remittable,
         c.effective_date AS effective_date,
         c.parent_id,
         pc.name AS parent_name,
         m.name AS member_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN categories pc ON pc.id = c.parent_id
       LEFT JOIN members m ON m.id = t.member_id
       WHERE ${dateFilterColumn} >= date(?) AND ${dateFilterColumn} <= date(?)
      ORDER BY t.updated_at DESC, t.id DESC
       LIMIT ? OFFSET ?`,
      [startDate, endDate, normalizedLimit, offset],
    );
    return res.values as Transaction[];
  }

  async countByDateRange(
    startDate: string,
    endDate: string,
    dateField: 'date' | 'created_at' | 'updated_at' = 'date',
  ): Promise<number> {
    const dateFilterColumn = this.resolveDateFilterColumn(dateField);
    const res = await database.query(
      `SELECT COUNT(*) AS count
       FROM transactions t
       WHERE ${dateFilterColumn} >= date(?) AND ${dateFilterColumn} <= date(?)`,
      [startDate, endDate],
    );
    return (res.values?.[0]?.count as number) ?? 0;
  }
}
