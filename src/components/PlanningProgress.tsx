import React from 'react';
import { Target, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface PlanningProgressProps {
  budgetLimit: number;
  savingsGoal: number;
  totalExpenses: number;
  totalIncome: number;
}

export default function PlanningProgress({ budgetLimit, savingsGoal, totalExpenses, totalIncome }: PlanningProgressProps) {
  const currentSavings = totalIncome - totalExpenses;
  
  const budgetProgress = budgetLimit > 0 ? (totalExpenses / budgetLimit) * 100 : 0;
  const savingsProgress = savingsGoal > 0 ? (currentSavings / savingsGoal) * 100 : 0;

  const getProgressColor = (progress: number, isBudget: boolean) => {
    if (isBudget) {
      if (progress > 100) return 'bg-red-500';
      if (progress > 80) return 'bg-amber-500';
      return 'bg-emerald-500';
    } else {
      if (progress >= 100) return 'bg-emerald-500';
      if (progress > 50) return 'bg-amber-500';
      return 'bg-blue-500';
    }
  };

  if (budgetLimit === 0 && savingsGoal === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {budgetLimit > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Limite de Gastos</h3>
                <p className="text-xl font-black dark:text-white">
                  R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                  <span className="text-sm font-medium text-zinc-400 ml-1">/ R$ {budgetLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
            </div>
            {budgetProgress > 100 && (
              <div className="flex items-center gap-1 text-red-500 text-xs font-bold animate-pulse">
                <AlertCircle className="w-4 h-4" />
                EXCEDIDO
              </div>
            )}
          </div>

          <div className="relative h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetProgress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`absolute top-0 left-0 h-full rounded-full ${getProgressColor(budgetProgress, true)}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-bold text-zinc-400">
            <span>{budgetProgress.toFixed(1)}% utilizado</span>
            <span>Restam R$ {Math.max(0, budgetLimit - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </motion.div>
      )}

      {savingsGoal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Meta de Economia</h3>
                <p className="text-xl font-black dark:text-white">
                  R$ {currentSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                  <span className="text-sm font-medium text-zinc-400 ml-1">/ R$ {savingsGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
            </div>
            {savingsProgress >= 100 && (
              <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                <TrendingUp className="w-4 h-4" />
                ALCANÇADA
              </div>
            )}
          </div>

          <div className="relative h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(savingsProgress, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`absolute top-0 left-0 h-full rounded-full ${getProgressColor(savingsProgress, false)}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-bold text-zinc-400">
            <span>{Math.max(0, savingsProgress).toFixed(1)}% da meta</span>
            <span>Faltam R$ {Math.max(0, savingsGoal - currentSavings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
