import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Category } from 'src/databases/entities/category';
import { CategoryRepository } from 'src/databases/repositories/category.repository';

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: [] as Category[],
    categoryRepository: null as CategoryRepository | null,
  }),

  getters: {
    categoryCount: (state) => state.categories.length,
    categoryList: (state) => state.categories,
    category: (state) => (id: number) => state.categories.find((m) => m.id === id),
  },

  actions: {
    async init() {
      this.categoryRepository = new CategoryRepository();
      this.categories = await this.categoryRepository.findAll();
    },
    async addCategory(data: Partial<Category>) {
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      const id = await this.categoryRepository.insert(data);
      const category = { ...data, id } as Category;
      this.categories.push(category);
    },
    async updateCategory(category: Partial<Category>) {
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      await this.categoryRepository.update(category);
      const index = this.categories.findIndex((m) => m.id === category.id);
      if (index !== -1) {
        this.categories[index] = { ...this.categories[index], ...category } as Category;
      }
    },
    async deleteCategory(id: number) {
      if (!this.categoryRepository) throw new Error('Repository not initialized');
      await this.categoryRepository.delete(id);
      this.categories = this.categories.filter((m) => m.id !== id);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCategoriesStore, import.meta.hot));
}
