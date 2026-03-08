import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { Transaction } from '../types';

interface SummaryProps {
  transactions: Transaction[];
}

export default function Summary({ transactions }: SummaryProps) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const total = income - expenses;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass-card p-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Entradas</span>
          <ArrowUpCircle className="w-6 h-6 text-emerald-500" />
        </div>
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(income)}</span>
      </div>

      <div className="glass-card p-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Saidas</span>
          <ArrowDownCircle className="w-6 h-6 text-red-500" />
        </div>
        <span className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(expenses)}</span>
      </div>

      <div className={`glass-card p-6 flex flex-col gap-2 border-2 ${total >= 0 ? 'border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/10' : 'border-red-100 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/10'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Saldo Total</span>
          <Wallet className={`w-6 h-6 ${total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
        </div>
        <span className={`text-2xl font-bold ${total >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
