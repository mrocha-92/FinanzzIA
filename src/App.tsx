import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, PieChart, Moon, Sun, LogOut, Trash2, Settings, UserCircle } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import Summary from './components/Summary';
import ClosureModal from './components/ClosureModal';
import ClearDataModal from './components/ClearDataModal';
import PlanningModal from './components/PlanningModal';
import PlanningProgress from './components/PlanningProgress';
import Auth from './components/Auth';
import NavMenu from './components/NavMenu';
import { Transaction, TransactionType } from './types';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [planning, setPlanning] = useState({ budget_limit: 0, savings_goal: 0 });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        fetchTransactions();
        fetchPlanning();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setTransactions([]);
      setPlanning({ budget_limit: 0, savings_goal: 0 });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    fetchTransactions();
    fetchPlanning();
  };

  const fetchPlanning = async () => {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    try {
      const response = await fetch(`/api/planning/${currentMonth}`);
      if (response.ok) {
        const data = await response.json();
        setPlanning({ budget_limit: data.budget_limit, savings_goal: data.savings_goal });
      }
    } catch (error) {
      console.error('Failed to fetch planning:', error);
    }
  };

  const handleSavePlanning = async (data: { budget_limit: number; savings_goal: number }) => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    try {
      const response = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currentMonth, ...data }),
      });
      if (response.ok) {
        const updatedPlan = await response.json();
        setPlanning({ budget_limit: updatedPlan.budget_limit, savings_goal: updatedPlan.savings_goal });
        setIsPlanningModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to save planning:', error);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    console.log("Fetching transactions...");
    try {
      const response = await fetch('/api/transactions');
      console.log("Fetch response status:", response.status);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("Fetched data:", data);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      alert('Erro ao carregar transações. Verifique o console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async (newTransaction: { description: string; amount: number; type: TransactionType; date: string }) => {
    console.log("Adding transaction:", newTransaction);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });
      console.log("Add response status:", response.status);
      if (response.ok) {
        fetchTransactions();
      } else {
        const errorData = await response.json();
        console.error("Add transaction failed:", errorData);
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const handleUpdateTransaction = async (id: number, updatedTransaction: { description: string; amount: number; type: TransactionType; date: string }) => {
    console.log("Updating transaction:", id, updatedTransaction);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTransaction),
      });
      if (response.ok) {
        setEditingTransaction(null);
        fetchTransactions();
      } else {
        const errorData = await response.json();
        console.error("Update transaction failed:", errorData);
      }
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTransactions(transactions.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleClosure = async (format: 'pdf' | 'xlsx') => {
    if (transactions.length === 0) return;

    const totalBalance = transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    // 1. Export Data
    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Relatório Financeiro - FinanzzIA', 14, 15);
      doc.text(`Data do Fechamento: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);
      
      const tableData = transactions.map(t => [
        t.description,
        t.type === 'income' ? `+ R$ ${t.amount.toFixed(2)}` : `- R$ ${t.amount.toFixed(2)}`,
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.type === 'income' ? 'Entrada' : 'Saída'
      ]);

      autoTable(doc, {
        head: [['Descrição', 'Valor', 'Data', 'Tipo']],
        body: tableData,
        startY: 35,
      });

      const finalY = (doc as any).lastAutoTable.finalY || 35;
      doc.setFontSize(12);
      doc.text(`Saldo Final: ${formatCurrency(totalBalance)}`, 14, finalY + 15);

      doc.save(`relatorio_financeiro_${new Date().getTime()}.pdf`);
    } else {
      const data = transactions.map(t => ({
        Descrição: t.description,
        Valor: t.amount,
        Tipo: t.type === 'income' ? 'Entrada' : 'Saída',
        Data: new Date(t.date).toLocaleDateString('pt-BR')
      }));

      // Add balance row
      data.push({
        Descrição: 'SALDO FINAL',
        Valor: totalBalance as any,
        Tipo: '',
        Data: ''
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transações");
      XLSX.writeFile(workbook, `relatorio_financeiro_${new Date().getTime()}.xlsx`);
    }

    setIsClosureModalOpen(false);
    alert('Relatório exportado com sucesso!');
  };

  const handleClearData = async () => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
      });
      if (response.ok) {
        setTransactions([]);
        setIsClearDataModalOpen(false);
        alert('Todas as informações foram apagadas com sucesso.');
      }
    } catch (error) {
      console.error('Failed to clear transactions:', error);
      alert('Erro ao apagar os dados do servidor.');
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight dark:text-white">Finanzz<span className="text-emerald-600">IA</span></h1>
            </div>
            <div className="hidden lg:block h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
            <span className="hidden lg:block text-xs font-medium text-zinc-500 dark:text-zinc-400 capitalize">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <nav className="hidden md:flex items-center gap-2">
              <a 
                href="#" 
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </a>

              <NavMenu 
                label={user.full_name.split(' ')[0]} 
                icon={UserCircle} 
                items={[
                  { label: 'Planejamento', icon: PieChart, onClick: () => setIsPlanningModalOpen(true) },
                  { 
                    label: 'Fechamento', 
                    icon: LogOut, 
                    onClick: () => setIsClosureModalOpen(true),
                    className: 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  },
                  { 
                    label: 'Sair', 
                    icon: LogOut, 
                    onClick: handleLogout,
                    className: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/20'
                  },
                  { 
                    label: 'Apagar Informações', 
                    icon: Trash2, 
                    onClick: () => setIsClearDataModalOpen(true),
                    className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  },
                ]} 
              />
            </nav>

            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                aria-label="Alternar modo noturno"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PlanningProgress 
          budgetLimit={planning.budget_limit}
          savingsGoal={planning.savings_goal}
          totalExpenses={transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)}
          totalIncome={transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Summary transactions={transactions} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div 
            className="lg:col-span-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <TransactionForm 
              onAdd={handleAddTransaction} 
              onUpdate={handleUpdateTransaction}
              editingTransaction={editingTransaction}
              onCancelEdit={() => setEditingTransaction(null)}
            />
          </motion.div>
 
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <TransactionList
                transactions={transactions}
                onDelete={handleDeleteTransaction}
                onEdit={setEditingTransaction}
                filter={filter}
                onFilterChange={setFilter}
              />
            )}
          </motion.div>
        </div>
      </main>

      <ClosureModal 
        isOpen={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
        onConfirm={handleClosure}
        transactions={transactions}
      />

      <ClearDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onConfirm={handleClearData}
        transactionCount={transactions.length}
      />

      <PlanningModal
        isOpen={isPlanningModalOpen}
        onClose={() => setIsPlanningModalOpen(false)}
        onSave={handleSavePlanning}
        initialData={planning}
      />
    </div>
  );
}
