import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ActivityLog } from 'src/databases/entities/activity-logs';
import { ActivityLogRepository } from 'src/databases/repositories/activity-log.repository';

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
    async init() {
      this.activityLogRepository = new ActivityLogRepository();
      await this.fetchPage(1);
    },
    async fetchPage(page: number) {
      if (!this.activityLogRepository) {
        this.activityLogRepository = new ActivityLogRepository();
      }
      this.page = page;
      const [logs, total] = await Promise.all([
        this.activityLogRepository.findAllWithPagination(this.page, this.limit),
        this.activityLogRepository.countAll(),
      ]);
      this.activity_logs = logs;
      this.totalLogs = total;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useActivityLogsStore, import.meta.hot));
}
