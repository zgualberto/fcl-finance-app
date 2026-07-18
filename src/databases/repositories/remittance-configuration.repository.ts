import type { RemittanceConfiguration } from '../entities/remittance-configuration';
import type { BaseRepository } from './base.repository';
import { getDatabase } from 'src/services/database';

const database = getDatabase();

export class RemittanceConfigurationRepository implements BaseRepository<RemittanceConfiguration> {
  /**
   * Check if activating a configuration would violate single-active constraint
   */
  private async isAnotherConfigurationActive(excludeId?: number): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM remittance_configurations WHERE status = 1`;
    const params: (string | number)[] = [];

    if (excludeId !== undefined) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }

    const res = await database.query(query, params);
    const result = res.values?.[0] as { count: number };
    return result.count > 0;
  }

  async insert(config: Partial<RemittanceConfiguration>): Promise<number> {
    if (!config.start_date || !config.end_date) {
      throw new Error('Start date and end date are required');
    }

    // Validate end_date >= start_date
    if (new Date(config.end_date) < new Date(config.start_date)) {
      throw new Error('End date must be greater than or equal to start date');
    }

    // If trying to activate new config, deactivate others
    if (config.status) {
      const hasActive = await this.isAnotherConfigurationActive();
      if (hasActive) {
        // Deactivate all other configurations
        await database.run(`UPDATE remittance_configurations SET status = 0 WHERE status = 1`);
      }
    }

    const result = await database.run(
      `INSERT INTO remittance_configurations (start_date, end_date, status) VALUES (?, ?, ?)`,
      [config.start_date, config.end_date, config.status ? 1 : 0],
    );
    return result.changes?.lastId ?? 0;
  }

  async findAll(): Promise<RemittanceConfiguration[]> {
    const res = await database.query(
      `SELECT id, start_date, end_date, status, created_at FROM remittance_configurations ORDER BY status DESC, start_date DESC`,
    );
    return res.values as RemittanceConfiguration[];
  }

  async findById(id: number): Promise<RemittanceConfiguration | null> {
    const res = await database.query(
      `SELECT id, start_date, end_date, status, created_at FROM remittance_configurations WHERE id = ?`,
      [id],
    );
    const configs = res.values as RemittanceConfiguration[];
    return configs[0] ?? null;
  }

  async findAllWithPagination(
    page: number = 1,
    limit: number = 20,
  ): Promise<RemittanceConfiguration[]> {
    const offset = (page - 1) * limit;
    const res = await database.query(
      `SELECT id, start_date, end_date, status, created_at FROM remittance_configurations ORDER BY status DESC, start_date DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return res.values as RemittanceConfiguration[];
  }

  async countAll(): Promise<number> {
    const res = await database.query(`SELECT COUNT(*) as count FROM remittance_configurations`);
    return (res.values?.[0]?.count as number) ?? 0;
  }

  async findAllActive(): Promise<RemittanceConfiguration[]> {
    const res = await database.query(
      `SELECT id, start_date, end_date, status, created_at FROM remittance_configurations WHERE status = 1`,
    );
    return res.values as RemittanceConfiguration[];
  }

  async findActiveByDateRange(startDate: string, endDate: string): Promise<RemittanceConfiguration[]> {
    const res = await database.query(
      `SELECT id, start_date, end_date, status, created_at FROM remittance_configurations WHERE status = 1 AND start_date <= ? AND end_date >= ?`,
      [endDate, startDate],
    );
    return res.values as RemittanceConfiguration[];
  }

  update(config: Partial<RemittanceConfiguration>): void {
    void this.updateAsync(config);
  }

  async updateAsync(config: Partial<RemittanceConfiguration>): Promise<void> {
    if (!config.id) {
      throw new Error('Configuration ID is required for update');
    }

    if (config.start_date && config.end_date) {
      // Validate end_date >= start_date
      if (new Date(config.end_date) < new Date(config.start_date)) {
        throw new Error('End date must be greater than or equal to start date');
      }
    }

    // If activating this config, deactivate others
    if (config.status) {
      const hasActive = await this.isAnotherConfigurationActive(config.id);
      if (hasActive) {
        await database.run(
          `UPDATE remittance_configurations SET status = 0 WHERE status = 1 AND id != ?`,
          [config.id],
        );
      }
    }

    await database.run(
      `UPDATE remittance_configurations SET start_date = ?, end_date = ?, status = ? WHERE id = ?`,
      [config.start_date, config.end_date, config.status ? 1 : 0, config.id],
    );
  }

  delete(id: number): void {
    void database.run(`DELETE FROM remittance_configurations WHERE id = ?`, [id]);
  }

  async searchAllByKeyword(
    keyword: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<RemittanceConfiguration[]> {
    const offset = (page - 1) * limit;
    const likeTerm = `%${keyword}%`;
    const res = await database.query(
      `SELECT id, start_date, end_date, status, created_at FROM remittance_configurations WHERE start_date LIKE ? OR end_date LIKE ? ORDER BY status DESC, start_date DESC LIMIT ? OFFSET ?`,
      [likeTerm, likeTerm, limit, offset],
    );
    return res.values as RemittanceConfiguration[];
  }

  async countSearchResults(keyword: string): Promise<number> {
    const likeTerm = `%${keyword}%`;
    const res = await database.query(
      `SELECT COUNT(*) as count FROM remittance_configurations WHERE start_date LIKE ? OR end_date LIKE ?`,
      [likeTerm, likeTerm],
    );
    return (res.values?.[0]?.count as number) ?? 0;
  }
}
