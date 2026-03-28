import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ActivityLog } from 'src/databases/entities/activity-logs';
import { ActivityLogRepository } from 'src/databases/repositories/activity-log.repository';

export interface ActivityLogFilters {
  searchText?: string;
  fromDate?: string;
  toDate?: string;
}

export const useActivityLogsStore = defineStore('activityLogs', {
  state: () => ({
    activity_logs: [] as ActivityLog[],
    activityLogRepository: null as ActivityLogRepository | null,
    page: 1,
    limit: 20,
    totalLogs: 0,
  }),

  getters: {
    activityLogsList: (state) => state.activity_logs,
  },

  actions: {
    async init(loadAll = true) {
      this.activityLogRepository = new ActivityLogRepository();
      if (loadAll) {
        await this.fetchPage(1);
      }
    },
    async fetchPage(
      page: number,
      limit?: number,
      filters: ActivityLogFilters = {},
    ): Promise<{ rows: ActivityLog[]; total: number }> {
      if (!this.activityLogRepository) {
        this.activityLogRepository = new ActivityLogRepository();
      }
      const effectiveLimit = limit ?? this.limit;
      this.page = page;
      this.limit = effectiveLimit;
      const [logs, total] = await Promise.all([
        this.activityLogRepository.findAllWithPaginationByFilters(
          this.page,
          effectiveLimit,
          filters.searchText,
          filters.fromDate,
          filters.toDate,
        ),
        this.activityLogRepository.countAllByFilters(
          filters.searchText,
          filters.fromDate,
          filters.toDate,
        ),
      ]);
      this.activity_logs = logs;
      this.totalLogs = total;
      return { rows: logs, total };
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useActivityLogsStore, import.meta.hot));
}
