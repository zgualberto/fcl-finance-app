import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Transaction } from 'src/databases/entities/transaction';
import { TransactionRepository } from 'src/databases/repositories/transaction.repository';
import { ActivityLogService } from 'src/services/activity-log.service';
import type { TransactionType } from 'src/enums/transaction_type';

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
    ): Promise<{ collections: number; expenses: number; nonRemittableExpenses: number }> {
      if (!this.transactionRepository) {
        await this.init(false);
      }
      if (!this.transactionRepository) throw new Error('Repository not initialized');
      try {
        return await this.transactionRepository.getYtdSummaryTotals(startDate, endDate);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.activityLogService?.logErrActivity(message);
        return { collections: 0, expenses: 0, nonRemittableExpenses: 0 };
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
        expenses: number;
        nonRemittableExpenses: number;
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
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTransactionsStore, import.meta.hot));
}
