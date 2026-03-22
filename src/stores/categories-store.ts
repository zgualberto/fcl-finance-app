import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Category } from 'src/databases/entities/category';
import { CategoryRepository } from 'src/databases/repositories/category.repository';
import { ActivityLogService } from 'src/services/activity-log.service';

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: [] as Category[],
    categoryRepository: null as CategoryRepository | null,
    activityLogService: null as ActivityLogService | null,
    totalCategories: 0,
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
        await this.fetchPage(1);
      }
      this.activityLogService = new ActivityLogService();
    },
    async fetchPage(
      page: number,
      limit: number = 20,
    ): Promise<{ rows: Category[]; total: number }> {
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      const [rows, total] = await Promise.all([
        this.categoryRepository.findAllWithParentAndChildSortingPaginated(page, limit),
        this.categoryRepository.countAll(),
      ]);
      this.categories = rows;
      this.totalCategories = total;
      return { rows, total };
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
    async searchByKeyword(keyword: string, transactionType: string): Promise<Category[]> {
      if (!this.categoryRepository) {
        await this.init(false);
      }
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      try {
        return await this.categoryRepository.searchByKeyword(keyword, transactionType);
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
        await this.fetchPage(1);
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
