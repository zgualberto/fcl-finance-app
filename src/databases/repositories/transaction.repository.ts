import type { Transaction } from '../entities/transaction';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';
import { TransactionType } from 'src/enums/transaction_type';

const database = getDatabase();

export class TransactionRepository implements BaseRepository<Transaction> {
  private buildInsertParams(transaction: Partial<Transaction>): Array<number | string | null> {
    return [
      transaction.member_id ?? null,
      transaction.category_id ?? null,
      transaction.amount ?? 0,
      transaction.description ?? '',
      transaction.date ?? '',
      transaction.is_legacy ?? 0,
    ];
  }

  async insert(transaction: Partial<Transaction>): Promise<number> {
    const result = await database.run(
      `INSERT INTO transactions (member_id, category_id, amount, description, date, is_legacy)
       VALUES (?, ?, ?, ?, ?, ?)`
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
       ORDER BY t.date DESC, t.created_at DESC`,
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
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        transaction.member_id ?? null,
        transaction.category_id ?? null,
        transaction.amount,
        transaction.description ?? '',
        transaction.date,
        transaction.is_legacy ?? 0,
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
          `INSERT INTO transactions (member_id, category_id, amount, description, date, is_legacy)
         VALUES (?, ?, ?, ?, ?, ?)`
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
       ORDER BY t.date ASC, t.created_at ASC`,
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

  async findByCollectionDate(
    date: string,
    transactionType?: TransactionType,
  ): Promise<Transaction[]> {
    let query = `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.is_legacy,
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
       ORDER BY t.date DESC, t.created_at DESC
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
  ): Promise<{ collections: number; expenses: number; nonRemittableExpenses: number }> {
    const res = await database.query(
      `SELECT
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) AS collections,
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) AS expenses,
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
        TransactionType.EXPENSES,
        TransactionType.EXPENSES,
        startDate,
        endDate,
      ],
    );

    return {
      collections: (res.values?.[0]?.collections as number) ?? 0,
      expenses: (res.values?.[0]?.expenses as number) ?? 0,
      nonRemittableExpenses: (res.values?.[0]?.nonRemittableExpenses as number) ?? 0,
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
      expenses: number;
      nonRemittableExpenses: number;
    }>
  > {
    const offset = (page - 1) * limit;

    const res = await database.query(
      `SELECT
         t.date AS date,
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) AS collection,
         COALESCE(SUM(CASE WHEN c.transaction_type = ? THEN t.amount ELSE 0 END), 0) AS expenses,
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
        TransactionType.EXPENSES,
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
        expenses: number;
        nonRemittableExpenses: number;
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
       ORDER BY t.date DESC, t.created_at DESC
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
    page: number = 1,
    limit: number = 20,
  ): Promise<Transaction[]> {
    const offset = (page - 1) * limit;
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.is_legacy,
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
       WHERE t.date >= ? AND t.date <= ?
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT ? OFFSET ?`,
      [startDate, endDate, limit, offset],
    );
    return res.values as Transaction[];
  }

  async countByDateRange(startDate: string, endDate: string): Promise<number> {
    const res = await database.query(
      `SELECT COUNT(*) AS count
       FROM transactions t
       WHERE t.date >= ? AND t.date <= ?`,
      [startDate, endDate],
    );
    return (res.values?.[0]?.count as number) ?? 0;
  }
}
