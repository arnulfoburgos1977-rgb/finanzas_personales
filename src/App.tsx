import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  LayoutGrid,
  BarChart3,
  Flame,
  Plus,
  Bot,
  LogOut,
  Loader2,
  User as UserIcon,
} from 'lucide-react';
import { auth } from './firebase';
import {
  addUserTransaction,
  deleteUserTransaction,
  saveInitialMonthlyBudget,
  subscribeUserAccount,
  subscribeUserTransactions,
  updateMonthlyBudget,
  updateUserTransaction,
} from './services/financeService';
import SummaryCard from './components/SummaryCard';
import SpendingChart from './components/SpendingChart';
import TransactionList from './components/TransactionList';
import BudgetProgress from './components/BudgetProgress';
import AddExpenseView from './components/AddExpenseView';
import AddIncomeView from './components/AddIncomeView';
import MovementsView from './components/MovementsView';
import DetailView from './components/DetailView';
import AssistantDrawer from './components/AssistantDrawer';
import AuthView from './components/AuthView';
import OnboardingBudgetModal from './components/OnboardingBudgetModal';
import { AppView, Transaction, UserAccount } from './types';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [detailBackView, setDetailBackView] = useState<'dashboard' | 'movements'>('movements');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // 1. Auth state listener: immediately reset user-scoped state on account switch or sign-out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setUserAccount(null);
      setTransactions([]);
      setSelectedTransaction(null);
      setCurrentView('dashboard');
      setIsAssistantOpen(false);
      setAccountLoading(Boolean(firebaseUser));
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to private user account document (/users/{uid})
  useEffect(() => {
    if (!authReady || !user) return;
    setAccountLoading(true);
    const unsubscribe = subscribeUserAccount(user.uid, (account) => {
      setUserAccount(account);
      setAccountLoading(false);
    });
    return () => unsubscribe();
  }, [authReady, user]);

  // 3. Subscribe to private user transactions (/users/{uid}/transactions) only after onboarding
  useEffect(() => {
    if (!authReady || !user || !userAccount?.hasCompletedOnboarding) {
      setTransactions([]);
      return;
    }
    const unsubscribe = subscribeUserTransactions(user.uid, (items) => {
      setTransactions(items);
    });
    return () => unsubscribe();
  }, [authReady, user, userAccount?.hasCompletedOnboarding]);

  const baseBudget = userAccount?.monthlyBudget ?? 0;

  const summary = useMemo(() => {
    const totalSpent = transactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = transactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const currentEffectiveBudget = baseBudget + totalIncome;
    const percentSpent =
      currentEffectiveBudget > 0 ? Math.min(100, (totalSpent / currentEffectiveBudget) * 100) : 0;

    return {
      monthlyBudget: currentEffectiveBudget,
      totalSpent,
      availableBalance: currentEffectiveBudget - totalSpent,
      percentSpent,
    };
  }, [transactions, baseBudget]);

  const chartData = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => {
      const dayNum = i + 1;
      const dayPad = dayNum.toString().padStart(2, '0');
      const dailyAmount = transactions
        .filter((tx) => {
          if (tx.type !== 'expense') return false;
          if (tx.isoDate) {
            return tx.isoDate.endsWith(`-${dayPad}`);
          }
          return tx.date.endsWith(`-${dayPad}`);
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        day: dayNum,
        amount: dailyAmount,
        actual: dailyAmount,
      };
    });
  }, [transactions]);

  const currentMonthLabel = useMemo(() => {
    const label = new Date().toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, []);

  const userDisplayName =
    userAccount?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Usuario';

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleConfirmOnboardingBudget = async (budget: number) => {
    if (!user) return;
    await saveInitialMonthlyBudget(user, budget, userDisplayName);
  };

  const handleUpdateBudget = async (newEffectiveBudget: number) => {
    if (!user) return;
    const totalIncome = transactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const newBaseBudget = Math.max(0, newEffectiveBudget - totalIncome);
    await updateMonthlyBudget(user.uid, newBaseBudget);
  };

  const handleSaveExpense = async (newExpense: Transaction) => {
    if (!user) return;
    await addUserTransaction(user.uid, {
      ...newExpense,
      type: 'expense',
    });
    setCurrentView('dashboard');
  };

  const handleSaveIncome = async (newIncome: Transaction) => {
    if (!user) return;
    await addUserTransaction(user.uid, {
      ...newIncome,
      type: 'income',
    });
    setCurrentView('dashboard');
  };

  const handleRegisterExpenseAI = async (data: any) => {
    if (!user) return;
    const rawIso = typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
      ? data.date
      : new Date().toISOString().split('T')[0];
    const formattedDate = new Date(`${rawIso}T12:00:00`).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const aiIcons: Record<string, string> = {
      'Alimentación': 'Utensils',
      'Transporte': 'Bus',
      'Servicios públicos': 'Zap',
      'Ropa y compras': 'ShoppingBag',
      'Entretenimiento': 'Film',
    };
    const category = data.category || 'Otro';

    await addUserTransaction(user.uid, {
      type: 'expense',
      amount: Number(data.amount) || 0,
      description: data.description || 'Gasto registrado',
      category,
      date: formattedDate,
      isoDate: rawIso,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      icon: aiIcons[category] || 'ShoppingBag',
      ...(data.paymentMethod ? { paymentMethod: String(data.paymentMethod) } : {}),
      ...(data.notes ? { notes: String(data.notes) } : {}),
    });
  };

  const handleViewDetails = (
    tx: Transaction,
    editMode = false,
    fromView: 'dashboard' | 'movements' = 'movements'
  ) => {
    if (tx.id === 'NEW_EXPENSE') {
      setCurrentView('add');
      return;
    }
    setSelectedTransaction(tx);
    setIsEditingDetail(editMode);
    setDetailBackView(fromView);
    setCurrentView('detail');
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;
    await updateUserTransaction(user.uid, id, updates);
    setSelectedTransaction((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
    setIsEditingDetail(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    await deleteUserTransaction(user.uid, id);
    if (selectedTransaction?.id === id) {
      setSelectedTransaction(null);
      setIsEditingDetail(false);
      if (currentView === 'detail') {
        setCurrentView(detailBackView);
      }
    }
  };

  const activeSelectedTransaction = selectedTransaction
    ? transactions.find((t) => t.id === selectedTransaction.id) || selectedTransaction
    : null;

  // Loading state while auth or initial account snapshot resolves
  if (!authReady || (user && accountLoading)) {
    return (
      <div className="min-h-screen bg-brand-bg text-slate-300 flex flex-col items-center justify-center gap-4">
        <Loader2 size={28} className="animate-spin text-brand-primary" />
        <p className="text-xs font-medium text-slate-400">Cargando tu cuenta...</p>
      </div>
    );
  }

  // Unauthenticated gate
  if (!user) {
    return <AuthView />;
  }

  // First-time account onboarding gate: ask for monthly budget
  if (!userAccount || !userAccount.hasCompletedOnboarding) {
    return (
      <OnboardingBudgetModal
        user={user}
        onConfirmBudget={handleConfirmOnboardingBudget}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-bg text-slate-300">
      {/* 1. Sidebar */}
      <aside className="w-16 md:w-20 border-r border-white/5 flex flex-col items-center py-8 gap-10 bg-brand-bg sticky top-0 h-screen">
        <button
          type="button"
          aria-label="Ir al inicio"
          className="text-brand-primary cursor-pointer"
          onClick={() => setCurrentView('dashboard')}
        >
          <Flame size={28} fill="currentColor" />
        </button>

        <nav className="flex flex-col gap-6">
          <button
            type="button"
            title="Dashboard"
            className={`nav-item ${currentView === 'dashboard' ? 'nav-item-active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            type="button"
            title="Historial de movimientos"
            className={`nav-item ${currentView === 'movements' ? 'nav-item-active' : ''}`}
            onClick={() => setCurrentView('movements')}
          >
            <BarChart3 size={20} />
          </button>
          <button
            type="button"
            title="Registrar gasto"
            className={`nav-item ${currentView === 'add' ? 'nav-item-active' : ''}`}
            onClick={() => setCurrentView('add')}
          >
            <Plus size={20} />
          </button>
        </nav>

        <div className="mt-auto">
          <button
            type="button"
            title="Cerrar sesión"
            onClick={handleSignOut}
            className="nav-item hover:text-rose-400"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              <header className="py-8 px-8 flex items-center justify-between flex-wrap gap-6 border-b border-white/5">
                <div>
                  <span className="text-xs font-semibold text-brand-primary tracking-wide">
                    Finanzas Personales
                  </span>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mt-1">
                    Mi Presupuesto Mensual
                  </h1>
                  <p className="text-sm text-slate-400 mt-1.5 font-medium">
                    Resumen general y control de movimientos · <span className="text-slate-200">{currentMonthLabel}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="glass-card px-4 py-2.5 flex items-center gap-3 border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/15 border border-brand-primary/30 text-brand-primary flex items-center justify-center shrink-0">
                      <UserIcon size={16} />
                    </div>
                    <div className="min-w-0 max-w-[180px]">
                      <p className="text-xs font-semibold text-white truncate">{userDisplayName}</p>
                      {user.email && (
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </header>

              <main className="px-8 py-8">
                <SummaryCard summary={summary} onUpdateBudget={handleUpdateBudget} />

                {transactions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card mt-8 p-12 md:p-16 flex flex-col items-center text-center border-dashed border-2 border-white/10 bg-transparent"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6 border border-brand-primary/20">
                      <LayoutGrid size={28} />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">
                      Aún no hay movimientos este mes
                    </h2>
                    <p className="text-sm text-slate-400 max-w-md mb-8">
                      Tu cuenta comienza desde cero. Registra tu primer gasto o ingreso para empezar a monitorear tu presupuesto mensual.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentView('add')}
                        className="flex items-center gap-2 bg-brand-primary text-white font-semibold text-xs px-6 py-3.5 rounded-xl shadow-glow hover:bg-brand-primary/90 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Plus size={16} />
                        Registrar tu primer gasto
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentView('add_income')}
                        className="flex items-center gap-2 bg-emerald-600 text-white font-semibold text-xs px-6 py-3.5 rounded-xl hover:bg-emerald-500 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Plus size={16} />
                        Registrar ingreso
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Quick Actions Container */}
                    <div className="mt-8 mb-10 flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-px w-8 bg-white/10"></div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Acciones rápidas
                        </span>
                        <div className="h-px w-8 bg-white/10"></div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl mx-auto">
                        <button
                          type="button"
                          onClick={() => setCurrentView('add_income')}
                          className="flex-1 flex items-center justify-center gap-3 bg-emerald-600 text-white font-semibold text-xs px-8 py-4 rounded-2xl hover:bg-emerald-500 transition-colors w-full h-14 cursor-pointer"
                        >
                          <Plus size={16} />
                          Registrar ingreso
                        </button>

                        <button
                          type="button"
                          onClick={() => setCurrentView('add')}
                          className="flex-1 flex items-center justify-center gap-3 bg-brand-primary text-white font-semibold text-xs px-8 py-4 rounded-2xl shadow-glow hover:bg-brand-primary/90 transition-colors w-full h-14 cursor-pointer"
                        >
                          <Plus size={16} />
                          Registrar gasto
                        </button>
                      </div>
                    </div>

                    <BudgetProgress summary={summary} />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                      <div className="lg:col-span-7">
                        <SpendingChart data={chartData} />
                      </div>
                      <div className="lg:col-span-5">
                        <TransactionList
                          transactions={transactions.slice(0, 4)}
                          onSeeAll={() => setCurrentView('movements')}
                          onSelectTransaction={(tx, editMode) =>
                            handleViewDetails(tx, Boolean(editMode), 'dashboard')
                          }
                          onDeleteTransaction={handleDeleteTransaction}
                        />
                      </div>
                    </div>
                  </>
                )}
              </main>
            </motion.div>
          )}

          {currentView === 'movements' && (
            <motion.div
              key="movements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 flex-1"
            >
              <MovementsView
                transactions={transactions}
                onBack={() => setCurrentView('dashboard')}
                onSelectTransaction={(tx, editMode) =>
                  handleViewDetails(tx, Boolean(editMode), 'movements')
                }
                onDeleteTransaction={handleDeleteTransaction}
              />
            </motion.div>
          )}

          {currentView === 'detail' && activeSelectedTransaction && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 flex-1"
            >
              <DetailView
                transaction={activeSelectedTransaction}
                initialEditing={isEditingDetail}
                onBack={() => {
                  setIsEditingDetail(false);
                  setCurrentView(detailBackView);
                }}
                onUpdate={handleUpdateTransaction}
                onDelete={handleDeleteTransaction}
              />
            </motion.div>
          )}

          {currentView === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 flex-1 flex flex-col justify-center"
            >
              <AddExpenseView
                onClose={() => setCurrentView('dashboard')}
                onSave={handleSaveExpense}
              />
            </motion.div>
          )}

          {currentView === 'add_income' && (
            <motion.div
              key="add_income"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 flex-1 flex flex-col justify-center"
            >
              <AddIncomeView
                onClose={() => setCurrentView('dashboard')}
                onSave={handleSaveIncome}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Assistant Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAssistantOpen(true)}
          aria-label="Abrir asistente financiero"
          className="fixed bottom-8 right-8 w-14 h-14 bg-brand-primary text-white rounded-2xl shadow-[0_0_30px_rgba(91,61,245,0.4)] flex items-center justify-center z-50 group overflow-hidden border border-white/10 cursor-pointer"
        >
          <Bot size={24} className="relative z-10" />
        </motion.button>

        <AssistantDrawer
          userId={user.uid}
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          transactions={transactions}
          onRegisterExpense={handleRegisterExpenseAI}
          onEditExpense={handleUpdateTransaction}
          onDeleteExpense={handleDeleteTransaction}
          context={{
            userName: userDisplayName,
            availableBalance: summary.availableBalance,
            currentDate: new Date().toISOString().split('T')[0],
          }}
        />
      </div>
    </div>
  );
}
