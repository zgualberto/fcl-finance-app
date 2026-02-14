import type { Member } from '../entities/member';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class MemberRepository implements BaseRepository<Member> {
  async insert(member: Member): Promise<number> {
    const result = await database.run(`INSERT INTO members (name, is_active) VALUES (?, ?)`, [
      member.name,
      member.is_active ? 1 : 0,
    ]);
    return result.changes?.lastId ?? 0;
  }

  async findAll(): Promise<Member[]> {
    const res = await database.query(`SELECT * FROM members ORDER BY created_at DESC`);
    return res.values as Member[];
  }

  async findById(id: number): Promise<Member | null> {
    const res = await database.query(`SELECT * FROM members WHERE id = ?`, [id]);
    const members = res.values as Member[];
    return members[0] ?? null;
  }

  async findByNameLike(searchTerm: string, limit = 25): Promise<Member[]> {
    const likeTerm = `%${searchTerm}%`;
    const res = await database.query(
      `SELECT * FROM members WHERE name LIKE ? AND is_active = 1 ORDER BY name ASC LIMIT ?`,
      [likeTerm, limit],
    );
    return res.values as Member[];
  }

  async findDisabledByExactName(name: string): Promise<Member | null> {
    const res = await database.query(
      `SELECT * FROM members WHERE name = ? AND is_active = 0 LIMIT 1`,
      [name],
    );
    const members = res.values as Member[];
    return members[0] ?? null;
  }

  update(member: Partial<Member>): void {
    void database.run(
      `UPDATE members SET name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [member.name, member.is_active ? 1 : 0, member.id],
    );
  }

  delete(id: number): void {
    void database.run(`DELETE FROM members WHERE id = ?`, [id]);
  }
}
