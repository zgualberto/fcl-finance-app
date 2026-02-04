import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ActivityLog } from 'src/databases/entities/activity-logs';
import { ActivityLogRepository } from 'src/databases/repositories/activity-log.repository';

export const useActivityLogsStore = defineStore('activityLogs', {
  state: () => ({
    activity_logs: [] as ActivityLog[],
    activityLogRepository: null as ActivityLogRepository | null,
    page: 1,
    limit: 20,
  }),

  getters: {
    activityLogsList: (state) => state.activity_logs,
  },

  actions: {
    async init() {
      this.activityLogRepository = new ActivityLogRepository();
      this.activity_logs = await this.activityLogRepository.findAllWithPagination(
        this.page,
        this.limit,
      );
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useActivityLogsStore, import.meta.hot));
}
