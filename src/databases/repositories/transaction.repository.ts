import type { Transaction } from '../entities/transaction';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class TransactionRepository implements BaseRepository<Transaction> {
  async insert(transaction: Partial<Transaction>): Promise<number> {
    const result = await database.run(
      `INSERT INTO transactions (member_id, category_id, amount, description, date)
       VALUES (?, ?, ?, ?, ?)`
        .replace(/\s+/g, ' ')
        .trim(),
      [
        transaction.member_id ?? null,
        transaction.category_id ?? null,
        transaction.amount,
        transaction.description ?? '',
        transaction.date,
      ],
    );
    return result.changes?.lastId ?? 0;
  }

  async findAll(): Promise<Transaction[]> {
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type,
         m.name AS member_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN members m ON m.id = t.member_id
       ORDER BY t.date DESC, t.created_at DESC`,
    );
    return res.values as Transaction[];
  }

  async findById(id: number): Promise<Transaction | null> {
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type,
         m.name AS member_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN members m ON m.id = t.member_id
       WHERE t.id = ?`,
      [id],
    );
    const transactions = res.values as Transaction[];
    return transactions[0] ?? null;
  }

  update(transaction: Partial<Transaction>): void {
    void database.run(
      `UPDATE transactions SET
         member_id = ?,
         category_id = ?,
         amount = ?,
         description = ?,
         date = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        transaction.member_id ?? null,
        transaction.category_id ?? null,
        transaction.amount,
        transaction.description ?? '',
        transaction.date,
        transaction.id,
      ],
    );
  }

  delete(id: number): void {
    void database.run(`DELETE FROM transactions WHERE id = ?`, [id]);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const res = await database.query(
      `SELECT
         t.id,
         t.member_id,
         t.category_id,
         t.amount,
         t.description,
         t.date,
         t.created_at,
         t.updated_at,
         c.name AS category_name,
         c.transaction_type,
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
}
