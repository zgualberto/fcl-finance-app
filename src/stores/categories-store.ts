import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Category } from 'src/databases/entities/category';
import { CategoryRepository } from 'src/databases/repositories/category.repository';
import { ActivityLogService } from 'src/services/activity-log.service';

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: [] as Category[],
    categoryRepository: null as CategoryRepository | null,
    activityLogService: null as ActivityLogService | null,
  }),

  getters: {
    categoryCount: (state) => state.categories.length,
    categoryList: (state) => state.categories,
    category: (state) => (id: number) => state.categories.find((m) => m.id === id),
  },

  actions: {
    async init(loadAll = true) {
      this.categoryRepository = new CategoryRepository();
      if (loadAll) {
        this.categories = await this.categoryRepository.findAllWithParentAndChildSorting();
      }
      this.activityLogService = new ActivityLogService();
    },
    async fetchCategoriesByNames(names: string[]): Promise<Category[]> {
      if (!this.categoryRepository) {
        await this.init(false);
      }
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      try {
        return await this.categoryRepository.findByNames(names);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return [];
      }
    },
    async addCategory(data: Partial<Category>): Promise<void> {
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      try {
        await this.categoryRepository.insert(data);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
    async updateCategory(category: Partial<Category>) {
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      try {
        void this.categoryRepository.update(category);
        this.categories = await this.categoryRepository.findAllWithParentAndChildSorting();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
    deleteCategory(id: number) {
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      try {
        void this.categoryRepository.delete(id);
        this.categories = this.categories.filter((m) => m.id !== id);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCategoriesStore, import.meta.hot));
}
