import { ExpenseBudgetSource } from 'src/enums/expense_budget_source';
import { TransactionType } from 'src/enums/transaction_type';
import type { Transaction } from 'src/databases/entities/transaction';

type TransactionBudgetFields = Pick<Transaction, 'transaction_type' | 'budget_source'>;

export function isCentralFundExpense(transaction: TransactionBudgetFields): boolean {
  return (
    transaction.transaction_type === TransactionType.EXPENSES &&
    transaction.budget_source === ExpenseBudgetSource.CENTRAL_FUND
  );
}

export function isNonCentralFundExpense(transaction: TransactionBudgetFields): boolean {
  return (
    transaction.transaction_type === TransactionType.EXPENSES &&
    !isCentralFundExpense(transaction)
  );
}