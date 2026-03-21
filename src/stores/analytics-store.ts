import { defineStore, acceptHMRUpdate } from 'pinia';

interface YearOption {
  label: string;
  value: string;
}

function buildYearsOptions(length = 50): YearOption[] {
  return Array.from({ length }, (_, index) => {
    const year = new Date().getFullYear() - index;
    return { label: String(year), value: String(year) };
  });
}

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    selectedYear: String(new Date().getFullYear()) as string | null,
    selectedMonth: null as string | null,
    selectedCategory: null as string | null,
    yearsOptions: buildYearsOptions(),
  }),

  getters: {
    selectedYearNumber: (state): number | null => {
      if (!state.selectedYear) {
        return null;
      }

      const parsedYear = Number.parseInt(state.selectedYear, 10);
      return Number.isNaN(parsedYear) ? null : parsedYear;
    },
    previousYearLabel(): string {
      if (!this.selectedYearNumber) {
        return '';
      }

      return String(this.selectedYearNumber - 1);
    },
  },

  actions: {
    setSelectedYear(year: string | null): void {
      this.selectedYear = year;
    },
    setSelectedMonth(month: string | null): void {
      this.selectedMonth = month;
    },
    setSelectedCategory(category: string | null): void {
      this.selectedCategory = category;
    },
    resetFilters(): void {
      this.selectedMonth = null;
      this.selectedCategory = null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAnalyticsStore, import.meta.hot));
}
