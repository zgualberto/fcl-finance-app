import type { Setting } from '../entities/setting';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class SettingRepository implements BaseRepository<Setting> {
  async insert(setting: Partial<Setting>): Promise<number> {
    const result = await database.run(
      `INSERT INTO application_settings (key, value) VALUES (?, ?)`,
      [setting.key, setting.value ?? ''],
    );
    return result.changes?.changes ?? 0;
  }

  async findAll(): Promise<Setting[]> {
    const res = await database.query(`SELECT * FROM application_settings ORDER BY key ASC`);
    return res.values as Setting[];
  }

  async findByKey(key: string): Promise<Setting | null> {
    const res = await database.query(`SELECT * FROM application_settings WHERE key = ?`, [key]);
    const settings = res.values as Setting[];
    return settings[0] ?? null;
  }

  async upsert(setting: Partial<Setting>): Promise<void> {
    await database.run(
      `INSERT INTO application_settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key)
       DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [setting.key, setting.value ?? ''],
    );
  }

  update(setting: Partial<Setting>): void {
    void database.run(
      `UPDATE application_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?`,
      [setting.value ?? '', setting.key],
    );
  }

  deleteByKey(key: string): void {
    void database.run(`DELETE FROM application_settings WHERE key = ?`, [key]);
  }

  // Included for BaseRepository compatibility; settings are keyed by string key.
  delete(id: number): void {
    void database.run(`DELETE FROM application_settings WHERE rowid = ?`, [id]);
  }
}
