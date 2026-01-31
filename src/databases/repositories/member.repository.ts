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
    console.log(result);
    return result.changes?.lastId ?? 0;
  }

  async findAll(): Promise<Member[]> {
    const res = await database.run(`SELECT * FROM members`);
    console.log(res);
    return [] as Member[];
  }

  async findById(id: number): Promise<Member | null> {
    const res = await database.query(`SELECT * FROM members WHERE id = ?`, [id]);
    const members = res.values as Member[];
    return members[0] ?? null;
  }

  async update(member: Member): Promise<void> {
    await database.run(
      `UPDATE members SET name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [member.name, member.is_active ? 1 : 0, member.id],
    );
  }

  async delete(id: number): Promise<void> {
    await database.run(`DELETE FROM members WHERE id = ?`, [id]);
  }
}
