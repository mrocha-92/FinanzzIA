import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionCount: number;
}

export default function ClearDataModal({ isOpen, onClose, onConfirm, transactionCount }: ClearDataModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-md p-6 space-y-6 shadow-2xl border-red-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Apagar Informações</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Você tem certeza que deseja <span className="font-bold text-red-600 dark:text-red-400">apagar todas as informações</span>? 
              Esta ação é irreversível e removerá permanentemente as <span className="font-bold">{transactionCount}</span> transações cadastradas.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={transactionCount === 0}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
            >
              <Trash2 className="w-4 h-4" />
              Confirmar e Apagar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
