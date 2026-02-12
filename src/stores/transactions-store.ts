import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Transaction } from 'src/databases/entities/transaction';
import { TransactionRepository } from 'src/databases/repositories/transaction.repository';
import { ActivityLogService } from 'src/services/activity-log.service';

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    transactions: [] as Transaction[],
    transactionRepository: null as TransactionRepository | null,
    activityLogService: null as ActivityLogService | null,
  }),

  getters: {
    transactionCount: (state) => state.transactions.length,
    transactionList: (state) => state.transactions,
    transaction: (state) => (id: number) => state.transactions.find((t) => t.id === id),
  },

  actions: {
    async init() {
      this.transactionRepository = new TransactionRepository();
      this.transactions = await this.transactionRepository.findAll();
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
    async fetchTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
      if (!this.transactionRepository) {
        await this.init();
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
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTransactionsStore, import.meta.hot));
}
