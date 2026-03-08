import React, { useState, useEffect } from 'react';
import { X, Target, Wallet, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { budget_limit: number; savings_goal: number }) => void;
  initialData: { budget_limit: number; savings_goal: number };
}

export default function PlanningModal({ isOpen, onClose, onSave, initialData }: PlanningModalProps) {
  const [budgetLimit, setBudgetLimit] = useState(initialData.budget_limit);
  const [savingsGoal, setSavingsGoal] = useState(initialData.savings_goal);

  useEffect(() => {
    setBudgetLimit(initialData.budget_limit);
    setSavingsGoal(initialData.savings_goal);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ budget_limit: budgetLimit, savings_goal: savingsGoal });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">Planejamento Mensal</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Defina suas metas para este mês</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Limite de Gastos (Budget)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={budgetLimit || ''}
                        onChange={(e) => setBudgetLimit(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                        placeholder="Ex: 2000.00"
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">Quanto você pretende gastar no máximo este mês.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Meta de Economia (Savings)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        <Target className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={savingsGoal || ''}
                        onChange={(e) => setSavingsGoal(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                        placeholder="Ex: 500.00"
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">Quanto você deseja poupar este mês.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Metas
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
