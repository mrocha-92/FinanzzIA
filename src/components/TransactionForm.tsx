import React, { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, Calendar, Tag, DollarSign, Pencil, X } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface TransactionFormProps {
  onAdd: (transaction: { description: string; amount: number; type: TransactionType; date: string }) => void;
  onUpdate: (id: number, transaction: { description: string; amount: number; type: TransactionType; date: string }) => void;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
}

export default function TransactionForm({ onAdd, onUpdate, editingTransaction, onCancelEdit }: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('pt-BR');
  });

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      
      const [y, m, d] = editingTransaction.date.split('-');
      setDate(`${d}/${m}/${y}`);
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      const d = new Date();
      setDate(d.toLocaleDateString('pt-BR'));
    }
  }, [editingTransaction]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    
    setDate(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || date.length !== 10) return;

    const [d, m, y] = date.split('/');
    const isoDate = `${y}-${m}-${d}`;

    const transactionData = {
      description,
      amount: parseFloat(amount),
      type,
      date: isoDate,
    };

    if (editingTransaction) {
      onUpdate(editingTransaction.id, transactionData);
    } else {
      onAdd(transactionData);
    }

    if (!editingTransaction) {
      setDescription('');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`glass-card p-6 space-y-4 transition-all duration-300 ${editingTransaction ? 'ring-2 ring-emerald-500/50 bg-emerald-50/5 dark:bg-emerald-900/5' : ''}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-zinc-100">
          {editingTransaction ? (
            <>
              <Pencil className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Editar Transação
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Nova Transação
            </>
          )}
        </h2>
        {editingTransaction && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
            title="Cancelar edição"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Descrição</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Ex: Aluguel, Supermercado..."
              className="input-field pl-12 pr-4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Valor (R$)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              className="input-field pl-12 pr-4"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              className="input-field pl-12 pr-4"
              value={date}
              onChange={handleDateChange}
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
                type === 'income'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                  : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all ${
                type === 'expense'
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              <MinusCircle className="w-4 h-4" />
              Saída
            </button>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full mt-2">
        {editingTransaction ? 'Salvar Alterações' : 'Adicionar Transação'}
      </button>
    </form>
  );
}
