import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { Member } from '../entities/member';
import type { BaseRepository } from './base.repository';

export class MemberRepository implements BaseRepository<Member> {
  constructor(readonly db: SQLiteDBConnection) {}

  async insert(member: Member): Promise<number> {
    const result = await this.db.run(`INSERT INTO members (name, is_active) VALUES (?, ?)`, [
      member.name,
      member.is_active ? 1 : 0,
    ]);
    return result.changes?.lastId ?? 0;
  }

  async findAll(): Promise<Member[]> {
    const res = await this.db.query(`SELECT * FROM members`);
    return res.values as Member[];
  }

  async findById(id: number): Promise<Member | null> {
    const res = await this.db.query(`SELECT * FROM members WHERE id = ?`, [id]);
    const members = res.values as Member[];
    return members[0] ?? null;
  }

  async update(member: Member): Promise<void> {
    await this.db.run(
      `UPDATE members SET name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [member.name, member.is_active ? 1 : 0, member.id],
    );
  }

  async delete(id: number): Promise<void> {
    await this.db.run(`DELETE FROM members WHERE id = ?`, [id]);
  }
}
