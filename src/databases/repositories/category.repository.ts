import type { Category } from '../entities/category';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class CategoryRepository implements BaseRepository<Category> {
  async insert(category: Partial<Category>): Promise<number> {
    const result = await database.run(
      `INSERT INTO categories (name, is_active, parent_id, is_expense) VALUES (?, ?, ?, ?)`,
      [
        category.category_name,
        category.is_active ? 1 : 0,
        category.parent_id,
        category.is_expense ? 1 : 0,
      ],
    );
    return result.changes?.lastId ?? 0;
  }

  async findAll(): Promise<Category[]> {
    const res = await database.query(`
      SELECT
        id,
        name as category_name,
        is_active,
        created_at,
        parent_id,
        is_expense
      FROM categories
      ORDER BY created_at DESC
    `);
    return res.values as Category[];
  }

  async findById(id: number): Promise<Category | null> {
    const res = await database.query(
      `
        SELECT
          id,
          name as category_name,
          is_active,
          created_at,
          parent_id,
          is_expense
        FROM categories
        WHERE id = ?
      `,
      [id],
    );
    const category = res.values as Category[];
    return category[0] ?? null;
  }

  update(member: Partial<Category>): void {
    void database.run(
      `
        UPDATE categories SET
          name = ?,
          is_active = ?,
          parent_id = ?,
          is_expense = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        member.category_name,
        member.is_active ? 1 : 0,
        member.parent_id,
        member.is_expense ? 1 : 0,
        member.id,
      ],
    );
  }

  delete(id: number): void {
    void database.run(`DELETE FROM categories WHERE id = ?`, [id]);
  }

  async findAllWithParentAndChildSorting(): Promise<Category[]> {
    const res = await database.query(
      `
        SELECT
          c.id,
          c.name AS category_name,
          p.name AS parent_name,
          c.parent_id,
          c.is_expense,
          c.is_active
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        ORDER BY
          COALESCE(p.name, c.name),
          c.name
      `,
    );
    return res.values as Category[];
  }
}
