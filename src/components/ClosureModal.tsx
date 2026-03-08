import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, FileText, Table, X, Download, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (format: 'pdf' | 'xlsx') => void;
  transactions: Transaction[];
}

export default function ClosureModal({ isOpen, onClose, onConfirm, transactions }: ClosureModalProps) {
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');

  if (!isOpen) return null;

  const handleExport = () => {
    onConfirm(format);
  };

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
              <h2 className="text-xl font-bold">Atenção: Fechamento</h2>
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
              Você está prestes a realizar o <span className="font-bold text-zinc-900 dark:text-zinc-100">fechamento financeiro</span>. 
              Esta ação executará o seguinte passo:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Exportação de todas as transações ({transactions.length}) no formato escolhido.</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Escolha o formato do relatório
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  format === 'pdf'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-200 dark:hover:border-zinc-700'
                }`}
              >
                <FileText className="w-8 h-8" />
                <span className="text-sm font-medium">PDF (.pdf)</span>
              </button>
              <button
                onClick={() => setFormat('xlsx')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-200 dark:hover:border-zinc-700'
                }`}
              >
                <Table className="w-8 h-8" />
                <span className="text-sm font-medium">Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={transactions.length === 0}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              Confirmar e Exportar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
