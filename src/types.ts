export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  created_at: string;
}

export type TransactionType = 'income' | 'expense';
