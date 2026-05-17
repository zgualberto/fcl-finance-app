import { defineStore, acceptHMRUpdate } from 'pinia';
import type { RemittanceConfiguration } from 'src/databases/entities/remittance-configuration';
import { RemittanceConfigurationRepository } from 'src/databases/repositories/remittance-configuration.repository';
import { ActivityLogService } from 'src/services/activity-log.service';

export const useRemittanceConfigurationsStore = defineStore('remittance-configurations', {
  state: () => ({
    configurations: [] as RemittanceConfiguration[],
    configurationRepository: null as RemittanceConfigurationRepository | null,
    activityLogService: null as ActivityLogService | null,
    totalConfigurations: 0,
    activeConfiguration: null as RemittanceConfiguration | null,
  }),

  getters: {
    configurationCount: (state) => state.configurations.length,
    configurationList: (state) => state.configurations,
    configuration: (state) => (id: number) => state.configurations.find((c) => c.id === id),
  },

  actions: {
    clear() {
      this.configurations = [];
      this.totalConfigurations = 0;
      this.configurationRepository = null;
      this.activityLogService = null;
    },

    async init(loadAll = true) {
      this.configurationRepository = new RemittanceConfigurationRepository();
      if (loadAll) {
        await this.fetchPage(1);
      }
      this.activityLogService = new ActivityLogService();
      await this.fetchActiveConfiguration();
    },

    async fetchPage(
      page: number,
      limit: number = 20,
    ): Promise<{ rows: RemittanceConfiguration[]; total: number }> {
      if (!this.configurationRepository) throw new Error('Repository not initialized');
      const [rows, total] = await Promise.all([
        this.configurationRepository.findAllWithPagination(page, limit),
        this.configurationRepository.countAll(),
      ]);
      this.configurations = rows;
      this.totalConfigurations = total;
      return { rows, total };
    },

    async fetchAll(): Promise<RemittanceConfiguration[]> {
      if (!this.configurationRepository) {
        await this.init(false);
      }
      if (!this.configurationRepository) throw new Error('Repository not initialized');
      try {
        return await this.configurationRepository.findAll();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return [];
      }
    },

    async fetchActiveConfiguration(): Promise<RemittanceConfiguration | null> {
      if (!this.configurationRepository) {
        await this.init(false);
      }
      if (!this.configurationRepository) throw new Error('Repository not initialized');
      try {
        const results = await this.configurationRepository.findAllActive();
        this.activeConfiguration = results[0] ?? null;
        return this.activeConfiguration;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        this.activeConfiguration = null;
        return null;
      }
    },

    async addConfiguration(data: Partial<RemittanceConfiguration>): Promise<void> {
      if (!this.configurationRepository) throw new Error('Repository not initialized');
      try {
        await this.configurationRepository.insert(data);
        await this.fetchActiveConfiguration();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        throw error;
      }
    },

    async updateConfiguration(config: Partial<RemittanceConfiguration>) {
      if (!this.configurationRepository) throw new Error('Repository not initialized');
      try {
        await this.configurationRepository.updateAsync(config);
        await this.fetchPage(1);
        await this.fetchActiveConfiguration();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        throw error;
      }
    },

    async toggleStatus(id: number, newStatus: boolean): Promise<void> {
      if (!this.configurationRepository) throw new Error('Repository not initialized');
      try {
        const config = await this.configurationRepository.findById(id);
        if (!config) {
          throw new Error('Configuration not found');
        }
        await this.configurationRepository.updateAsync({
          ...config,
          status: newStatus ? 1 : 0,
        });
        await this.fetchPage(1);
        await this.fetchActiveConfiguration();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        throw error;
      }
    },

    async deleteConfiguration(id: number) {
      if (!this.configurationRepository) throw new Error('Repository not initialized');
      try {
        void this.configurationRepository.delete(id);
        this.configurations = this.configurations.filter((c) => c.id !== id);
        await this.fetchActiveConfiguration();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRemittanceConfigurationsStore, import.meta.hot));
}
