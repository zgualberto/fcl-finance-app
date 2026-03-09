import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Setting } from 'src/databases/entities/setting';
import { SettingRepository } from 'src/databases/repositories/setting.repository';
import { ActivityLogService } from 'src/services/activity-log.service';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: [] as Setting[],
    settingRepository: null as SettingRepository | null,
    activityLogService: null as ActivityLogService | null,
  }),

  getters: {
    settingCount: (state) => state.settings.length,
    settingList: (state) => state.settings,
    setting: (state) => (key: string) => state.settings.find((item) => item.key === key),
    settingValue: (state) => (key: string) =>
      state.settings.find((item) => item.key === key)?.value ?? '',
    nationalPercent: (state) => {
      const value = state.settings.find(
        (item) => item.key === 'application.national.percent',
      )?.value;
      if (!value) return 0.15;
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0.15 : parsed / 100;
    },
    districtPercent: (state) => {
      const value = state.settings.find(
        (item) => item.key === 'application.district.percent',
      )?.value;
      if (!value) return 0.03;
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0.03 : parsed / 100;
    },
  },

  actions: {
    async init(loadAll = true) {
      this.settingRepository = new SettingRepository();
      if (loadAll) {
        this.settings = await this.settingRepository.findAll();
      }
      this.activityLogService = new ActivityLogService();
    },

    async fetchAllSettings(): Promise<void> {
      if (!this.settingRepository) throw new Error('Repository not initialized');
      try {
        this.settings = await this.settingRepository.findAll();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },

    async saveSetting(setting: Partial<Setting>): Promise<void> {
      if (!this.settingRepository) throw new Error('Repository not initialized');
      try {
        const key = setting.key?.trim();
        if (!key) {
          throw new Error('Setting key is required');
        }

        await this.settingRepository.upsert({
          key,
          value: setting.value ?? '',
        });

        const index = this.settings.findIndex((item) => item.key === key);
        const now = new Date();

        if (index !== -1) {
          const existingCreatedAt = this.settings[index]?.created_at;
          const updatedSetting: Setting = {
            key,
            value: setting.value ?? '',
            updated_at: now,
            ...(existingCreatedAt ? { created_at: existingCreatedAt } : {}),
          };
          this.settings[index] = updatedSetting;
          return;
        }

        this.settings.unshift({
          key,
          value: setting.value ?? '',
          created_at: now,
          updated_at: now,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },

    deleteSetting(key: string): void {
      if (!this.settingRepository) throw new Error('Repository not initialized');
      try {
        this.settingRepository.deleteByKey(key);
        this.settings = this.settings.filter((item) => item.key !== key);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
