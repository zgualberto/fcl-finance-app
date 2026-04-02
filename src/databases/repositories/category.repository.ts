import type { Category } from '../entities/category';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class CategoryRepository implements BaseRepository<Category> {
  async insert(category: Partial<Category>): Promise<number> {
    const result = await database.run(
      `INSERT INTO categories (name, is_active, parent_id, transaction_type, non_remittable, effective_date) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        category.category_name,
        category.is_active ? 1 : 0,
        category.parent_id,
        category.transaction_type,
        category.non_remittable ? 1 : 0,
        category.effective_date ?? null,
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
        non_remittable,
        effective_date,
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
          non_remittable,
          effective_date,
          transaction_type
        FROM categories
        WHERE id = ?
      `,
      [id],
    );
    const category = res.values as Category[];
    return category[0] ?? null;
  }

  async findByNames(names: string[]): Promise<Category[]> {
    if (!names.length) {
      return [];
    }

    const normalizedNames = names.map((name) => name.trim().toLowerCase());
    const placeholders = normalizedNames.map(() => '?').join(', ');
    const res = await database.query(
      `
        SELECT
          id,
          name as category_name,
          is_active,
          created_at,
          parent_id,
          non_remittable,
          effective_date,
          transaction_type
        FROM categories
        WHERE LOWER(name) IN (${placeholders})
        ORDER BY name ASC
      `,
      normalizedNames,
    );
    return res.values as Category[];
  }

  update(member: Partial<Category>): void {
    void database.run(
      `
        UPDATE categories SET
          name = ?,
          is_active = ?,
          parent_id = ?,
          transaction_type = ?,
          non_remittable = COALESCE(?, non_remittable),
          effective_date = ?
        WHERE id = ?
      `,
      [
        member.category_name,
        member.is_active ? 1 : 0,
        member.parent_id,
        member.transaction_type,
        member.non_remittable == null ? null : member.non_remittable ? 1 : 0,
        member.effective_date ?? null,
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
            c.non_remittable,
            c.effective_date,
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
            parent.transaction_type,
            child.non_remittable,
            child.effective_date,
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
          non_remittable,
          effective_date,
          parent_name,
          path
        FROM category_tree
        ORDER BY path;
      `,
    );
    return res.values as Category[];
  }

  async findAllWithParentAndChildSortingPaginated(
    page: number = 1,
    limit: number = 20,
  ): Promise<Category[]> {
    const offset = (page - 1) * limit;
    const res = await database.query(
      `
        WITH RECURSIVE category_tree AS (
          SELECT
            c.id,
            c.name AS category_name,
            c.parent_id,
            c.is_active,
            c.transaction_type,
            c.non_remittable,
            c.effective_date,
            NULL AS parent_name,
            c.name AS path
          FROM categories c
          WHERE c.parent_id IS NULL

          UNION ALL

          SELECT
            child.id,
            child.name AS category_name,
            child.parent_id,
            child.is_active,
            child.transaction_type,
            child.non_remittable,
            child.effective_date,
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
          non_remittable,
          effective_date,
          parent_name,
          path
        FROM category_tree
        ORDER BY path
        LIMIT ? OFFSET ?
      `,
      [limit, offset],
    );
    return res.values as Category[];
  }

  async searchByKeyword(
    keyword: string,
    transactionType: string,
    limit: number = 30,
  ): Promise<Category[]> {
    const pattern = `%${keyword.toLowerCase()}%`;
    const res = await database.query(
      `
        SELECT
          c.id,
          c.name as category_name,
          c.is_active,
          c.created_at,
          c.parent_id,
          c.non_remittable,
          COALESCE(c.transaction_type, p.transaction_type) as transaction_type
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.parent_id IS NOT NULL
          AND c.is_active = 1
          AND (c.transaction_type = ? OR p.transaction_type = ?)
          AND LOWER(c.name) LIKE ?
        ORDER BY c.name ASC
        LIMIT ?
      `,
      [transactionType, transactionType, pattern, limit],
    );
    return res.values as Category[];
  }

  async searchParentCandidatesByKeyword(
    keyword: string,
    excludeId?: number,
    limit: number = 30,
  ): Promise<Category[]> {
    const pattern = `%${keyword.toLowerCase()}%`;
    const params: (string | number)[] = [pattern];
    let excludeClause = '';
    if (excludeId !== undefined) {
      excludeClause = 'AND id != ?';
      params.push(excludeId);
    }
    params.push(limit);
    const res = await database.query(
      `
        SELECT
          id,
          name as category_name,
          is_active,
          created_at,
          parent_id,
          non_remittable,
          transaction_type
        FROM categories
        WHERE parent_id IS NULL
          AND is_active = 1
          AND LOWER(name) LIKE ?
          ${excludeClause}
        ORDER BY name ASC
        LIMIT ?
      `,
      params,
    );
    return res.values as Category[];
  }

  async searchAllByKeyword(
    keyword: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<Category[]> {
    const offset = (page - 1) * limit;
    const pattern = `%${keyword.toLowerCase()}%`;
    const res = await database.query(
      `
        WITH RECURSIVE category_tree AS (
          SELECT
            c.id,
            c.name AS category_name,
            c.parent_id,
            c.is_active,
            c.transaction_type,
            c.non_remittable,
            c.effective_date,
            NULL AS parent_name,
            c.name AS path
          FROM categories c
          WHERE c.parent_id IS NULL

          UNION ALL

          SELECT
            child.id,
            child.name AS category_name,
            child.parent_id,
            child.is_active,
            child.transaction_type,
            child.non_remittable,
            child.effective_date,
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
          non_remittable,
          effective_date,
          parent_name,
          path
        FROM category_tree
        WHERE LOWER(category_name) LIKE ?
          OR LOWER(COALESCE(parent_name, '')) LIKE ?
          OR LOWER(path) LIKE ?
        ORDER BY path
        LIMIT ? OFFSET ?
      `,
      [pattern, pattern, pattern, limit, offset],
    );
    return res.values as Category[];
  }

  async countSearchResults(keyword: string): Promise<number> {
    const pattern = `%${keyword.toLowerCase()}%`;
    const res = await database.query(
      `
        WITH RECURSIVE category_tree AS (
          SELECT
            c.id,
            c.name AS category_name,
            c.parent_id,
            NULL AS parent_name,
            c.name AS path
          FROM categories c
          WHERE c.parent_id IS NULL

          UNION ALL

          SELECT
            child.id,
            child.name AS category_name,
            child.parent_id,
            parent.name AS parent_name,
            ct.path || ' / ' || child.name AS path
          FROM categories child
          JOIN category_tree ct ON child.parent_id = ct.id
          JOIN categories parent ON parent.id = child.parent_id
        )
        SELECT COUNT(*) AS count
        FROM category_tree
        WHERE LOWER(category_name) LIKE ?
          OR LOWER(COALESCE(parent_name, '')) LIKE ?
          OR LOWER(path) LIKE ?
      `,
      [pattern, pattern, pattern],
    );
    return (res.values?.[0]?.count as number) ?? 0;
  }

  async countAll(): Promise<number> {
    const res = await database.query('SELECT COUNT(*) AS count FROM categories');
    return (res.values?.[0]?.count as number) ?? 0;
  }
}
