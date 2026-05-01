import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Transaction } from 'src/databases/entities/transaction';
import { TransactionRepository } from 'src/databases/repositories/transaction.repository';
import { ActivityLogService } from 'src/services/activity-log.service';
import type { TransactionType } from 'src/enums/transaction_type';

type TransactionDateField = 'date' | 'created_at' | 'updated_at';

function isTransactionDateField(value: unknown): value is TransactionDateField {
  return value === 'date' || value === 'created_at' || value === 'updated_at';
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const normalized = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : fallback;
}

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    transactions: [] as Transaction[],
    transactionRepository: null as TransactionRepository | null,
    activityLogService: null as ActivityLogService | null,
    availableCollectionDates: [] as string[],
    totalTransactions: 0,
  }),

  getters: {
    transactionCount: (state) => state.transactions.length,
    transactionList: (state) => state.transactions,
    transaction: (state) => (id: number) => state.transactions.find((t) => t.id === id),
  },

  actions: {
    clear() {
      this.transactions = [];
      this.availableCollectionDates = [];
      this.totalTransactions = 0;
      this.transactionRepository = null;
      this.activityLogService = null;
    },
    async init(loadAll = true) {
      this.transactionRepository = new TransactionRepository();
      if (loadAll) {
        this.transactions = await this.transactionRepository.findAll();
      }
      this.activityLogService = new ActivityLogService();
    },
    async addTransaction(data: Partial<Transaction>): Promise<void> {
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        // TODO: check if transaction is aleady in the DB by comparing category_id, member_id, date

        await this.transactionRepository.insert(data);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
    async addTransactionsBatch(data: Partial<Transaction>[]): Promise<void> {
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      if (data.length === 0) return;

      for (const transaction of data) {
        await this.addTransaction(transaction);
      }
    },
    async replaceTransactionsByDate(
      date: string,
      transactionType: TransactionType,
      data: Partial<Transaction>[],
    ): Promise<void> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');

      try {
        await this.transactionRepository.replaceByDate(date, transactionType, data);
        this.transactions = this.transactions.filter(
          (t) => t.date !== date || t.transaction_type !== transactionType,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        throw error;
      }
    },
    updateTransaction(transaction: Partial<Transaction>) {
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        void this.transactionRepository.update(transaction);
        const index = this.transactions.findIndex((t) => t.id === transaction.id);
        if (index !== -1) {
          this.transactions[index] = { ...this.transactions[index], ...transaction } as Transaction;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
    deleteTransaction(id: number) {
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        void this.transactionRepository.delete(id);
        this.transactions = this.transactions.filter((t) => t.id !== id);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
    async deleteTransactionsByDate(date: string): Promise<void> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        await this.transactionRepository.deleteByDate(date);
        this.transactions = this.transactions.filter((t) => t.date !== date);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
      }
    },
    async fetchTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        return await this.transactionRepository.findByDateRange(startDate, endDate);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return [];
      }
    },
    async fetchCollectionDates(transactionType?: TransactionType): Promise<string[]> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        this.availableCollectionDates =
          await this.transactionRepository.findDistinctCollectionDates(transactionType);
        return this.availableCollectionDates;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return [];
      }
    },
    async fetchCollectionDatesPage(
      transactionType?: TransactionType,
      page: number = 1,
      limit: number = 25,
      searchTerm?: string,
    ): Promise<{ dates: string[]; total: number }> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        const [dates, total] = await Promise.all([
          this.transactionRepository.findDistinctCollectionDatesPaginated(
            transactionType,
            page,
            limit,
            searchTerm,
          ),
          this.transactionRepository.countDistinctCollectionDates(transactionType, searchTerm),
        ]);

        return { dates, total };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return { dates: [], total: 0 };
      }
    },
    async fetchTransactionByDate(
      date: string,
      transactionType?: TransactionType,
    ): Promise<Transaction[]> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        return await this.transactionRepository.findByCollectionDate(date, transactionType);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return [];
      }
    },
    async fetchPage(
      page: number,
      limit: number = 20,
    ): Promise<{ rows: Transaction[]; total: number }> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        const [rows, total] = await Promise.all([
          this.transactionRepository.findAllPaginated(page, limit),
          this.transactionRepository.countAll(),
        ]);
        this.transactions = rows;
        this.totalTransactions = total;
        return { rows, total };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return { rows: [], total: 0 };
      }
    },
    async fetchYtdSummaryTotals(
      startDate: string,
      endDate: string,
    ): Promise<{
      collections: number;
      legacyCollections: number;
      normalCollections: number;
      expenses: number;
      remittableExpenses: number;
      nonRemittableExpenses: number;
      centralFundExpenses: number;
    }> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        return await this.transactionRepository.getYtdSummaryTotals(startDate, endDate);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return {
          collections: 0,
          legacyCollections: 0,
          normalCollections: 0,
          expenses: 0,
          remittableExpenses: 0,
          nonRemittableExpenses: 0,
          centralFundExpenses: 0,
        };
      }
    },
    async fetchYtdPage(
      startDate: string,
      endDate: string,
      page: number,
      limit: number = 20,
    ): Promise<{
      rows: Array<{
        date: string;
        collection: number;
        legacyCollection: number;
        normalCollection: number;
        expenses: number;
        remittableExpenses: number;
        nonRemittableExpenses: number;
        centralFundExpenses: number;
      }>;
      total: number;
    }> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        const [rows, total] = await Promise.all([
          this.transactionRepository.findYtdByDatePaginated(startDate, endDate, page, limit),
          this.transactionRepository.countYtdDates(startDate, endDate),
        ]);

        return { rows, total };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return { rows: [], total: 0 };
      }
    },
    async searchTransactions(
      keyword: string,
      page: number,
      limit: number = 20,
    ): Promise<{ rows: Transaction[]; total: number }> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        const [rows, total] = await Promise.all([
          this.transactionRepository.searchByKeyword(keyword, page, limit),
          this.transactionRepository.countSearchResults(keyword),
        ]);
        this.transactions = rows;
        this.totalTransactions = total;
        return { rows, total };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return { rows: [], total: 0 };
      }
    },
    async fetchPageByDateRange(
      startDate: string,
      endDate: string,
      pageOrDateField: number | TransactionDateField,
      limitOrPage: number = 20,
      dateFieldOrLimit: TransactionDateField | number = 'date',
    ): Promise<{ rows: Transaction[]; total: number }> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');

      let page = 1;
      let limit = 20;
      let dateField: TransactionDateField = 'date';

      // Backward compatibility for previous call order:
      // (startDate, endDate, dateField, page, limit)
      if (isTransactionDateField(pageOrDateField)) {
        dateField = pageOrDateField;
        page = normalizePositiveInteger(limitOrPage, 1);
        limit = normalizePositiveInteger(dateFieldOrLimit, 20);
      } else {
        // Current call order:
        // (startDate, endDate, page, limit, dateField)
        page = normalizePositiveInteger(pageOrDateField, 1);
        limit = normalizePositiveInteger(limitOrPage, 20);
        if (isTransactionDateField(dateFieldOrLimit)) {
          dateField = dateFieldOrLimit;
        }
      }

      try {
        const [rows, total] = await Promise.all([
          this.transactionRepository.findByDateRangePaginated(
            startDate,
            endDate,
            dateField,
            page,
            limit,
          ),
          this.transactionRepository.countByDateRange(startDate, endDate, dateField),
        ]);
        this.transactions = rows;
        this.totalTransactions = total;
        return { rows, total };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return { rows: [], total: 0 };
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTransactionsStore, import.meta.hot));
}
