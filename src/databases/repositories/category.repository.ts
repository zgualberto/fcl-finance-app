import type { Category } from '../entities/category';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class CategoryRepository implements BaseRepository<Category> {
  async insert(category: Partial<Category>): Promise<number> {
    const result = await database.run(
      `INSERT INTO categories (name, is_active, parent_id, transaction_type) VALUES (?, ?, ?, ?)`,
      [
        category.category_name,
        category.is_active ? 1 : 0,
        category.parent_id,
        category.transaction_type,
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
        transaction_type
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
          transaction_type
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
          transaction_type = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        member.category_name,
        member.is_active ? 1 : 0,
        member.parent_id,
        member.transaction_type,
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
        WITH RECURSIVE category_tree AS (
          -- root categories
          SELECT
            c.id,
            c.name AS category_name,
            c.parent_id,
            c.is_active,
            c.transaction_type,
            NULL AS parent_name,
            c.name AS path
          FROM categories c
          WHERE c.parent_id IS NULL

          UNION ALL

          -- children
          SELECT
            child.id,
            child.name AS category_name,
            child.parent_id,
            child.is_active,
            child.transaction_type,
            parent.name AS parent_name,
            ct.path || ' / ' || child.name AS path
          FROM categories child
          JOIN category_tree ct ON child.parent_id = ct.id
          JOIN categories parent ON parent.id = child.parent_id
        )
        SELECT
          id,
          category_name,
          parent_id,
          is_active,
          transaction_type,
          parent_name,
          path
        FROM category_tree
        ORDER BY path;
      `,
    );
    return res.values as Category[];
  }
}
