import type { Category } from '../entities/category';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class CategoryRepository implements BaseRepository<Category> {
  async insert(category: Partial<Category>): Promise<number> {
    const result = await database.run(
      `INSERT INTO category (name, is_active, parent_id, is_expense) VALUES (?, ?, ?, ?)`,
      [category.name, category.is_active ? 1 : 0, category.parent_id, category.is_expense ? 1 : 0],
    );
    return result.changes?.lastId ?? 0;
  }

  async findAll(): Promise<Category[]> {
    const res = await database.query(`SELECT * FROM category ORDER BY created_at DESC`);
    return res.values as Category[];
  }

  async findById(id: number): Promise<Category | null> {
    const res = await database.query(`SELECT * FROM category WHERE id = ?`, [id]);
    const category = res.values as Category[];
    return category[0] ?? null;
  }

  async update(member: Partial<Category>): Promise<void> {
    await database.run(
      `UPDATE category SET
        name = ?,
        is_active = ?,
        parent_id = ?,
        is_expense = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        member.name,
        member.is_active ? 1 : 0,
        member.parent_id,
        member.is_expense ? 1 : 0,
        member.id,
      ],
    );
  }

  async delete(id: number): Promise<void> {
    await database.run(`DELETE FROM category WHERE id = ?`, [id]);
  }
}
