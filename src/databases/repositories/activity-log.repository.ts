import type { ActivityLog } from '../entities/activity-logs';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class ActivityLogRepository implements BaseRepository<ActivityLog> {
  async insert(log: Partial<ActivityLog>): Promise<number> {
    const result = await database.run(`INSERT INTO activity_logs (log, is_error) VALUES (?, ?)`, [
      log,
      log.is_error || false,
    ]);
    return result.changes?.lastId ?? 0;
  }

  async findAllWithPagination(page: number = 1, limit: number = 20): Promise<ActivityLog[]> {
    const offset = (page - 1) * limit;

    const res = await database.query(
      `
        SELECT *
        FROM activity_logs
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      [limit, offset],
    );
    return res.values as ActivityLog[];
  }
}
