import type { ActivityLog } from '../entities/activity-logs';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class ActivityLogRepository implements BaseRepository<ActivityLog> {
  private buildFilterQuery(searchText?: string, fromDate?: string, toDate?: string) {
    const conditions: string[] = [];
    const params: Array<string | number> = [];

    const keyword = searchText?.trim();
    if (keyword) {
      conditions.push('log LIKE ?');
      params.push(`%${keyword}%`);
    }

    if (fromDate) {
      conditions.push('date(created_at) >= date(?)');
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push('date(created_at) <= date(?)');
      params.push(toDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  async insert(log: Partial<ActivityLog>): Promise<number> {
    const result = await database.run(`INSERT INTO activity_logs (log, is_error) VALUES (?, ?)`, [
      log.log,
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

  async countAll(): Promise<number> {
    const res = await database.query('SELECT COUNT(*) AS count FROM activity_logs');
    return (res.values?.[0]?.count as number) ?? 0;
  }

  async findAllWithPaginationByFilters(
    page: number = 1,
    limit: number = 20,
    searchText?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<ActivityLog[]> {
    const offset = (page - 1) * limit;
    const { whereClause, params } = this.buildFilterQuery(searchText, fromDate, toDate);

    const res = await database.query(
      `
        SELECT *
        FROM activity_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      [...params, limit, offset],
    );
    return res.values as ActivityLog[];
  }

  async countAllByFilters(
    searchText?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<number> {
    const { whereClause, params } = this.buildFilterQuery(searchText, fromDate, toDate);
    const res = await database.query(
      `
        SELECT COUNT(*) AS count
        FROM activity_logs
        ${whereClause}
      `,
      params,
    );
    return (res.values?.[0]?.count as number) ?? 0;
  }
}
