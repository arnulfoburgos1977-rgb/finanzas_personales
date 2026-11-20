import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Search,
  Utensils,
  Bus,
  Zap,
  ShoppingBag,
  Film,
  ChevronRight,
  Banknote,
  BarChart3,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';

interface MovementsViewProps {
  transactions: Transaction[];
  onBack: () => void;
  onSelectTransaction: (tx: Transaction, editMode?: boolean) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
}

const ICON_MAP: Record<string, any> = { Utensils, Bus, Zap, ShoppingBag, Film, Banknote };

export default function MovementsView({
  transactions,
  onBack,
  onSelectTransaction,
  onDeleteTransaction,
}: MovementsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentMonthLabel = useMemo(() => {
    const label = new Date().toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, []);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (!q) return true;
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.notes || '').toLowerCase().includes(q)
      );
    });
  }, [transactions, searchQuery, typeFilter]);

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteTransaction(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-bold uppercase tracking-widest">Dashboard</span>
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar movimientos..."
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-brand-primary/50 transition-all w-56 sm:w-64"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'all' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'expense' ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gastos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ingresos
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h2 className="text-xl font-display font-bold text-white">Historial de Movimientos</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">{currentMonthLabel}</p>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center px-8">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 mb-6 border border-white/5">
              <BarChart3 size={28} />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">
              {transactions.length === 0 ? 'Tus movimientos van a vivir aquí' : 'Sin resultados'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mb-8">
              {transactions.length === 0
                ? 'Cada vez que registres un gasto o ingreso, aparecerá en esta lista.'
                : 'No encontramos movimientos que coincidan con tu búsqueda o filtro.'}
            </p>
            {transactions.length === 0 && (
              <button
                onClick={() => onSelectTransaction({ id: 'NEW_EXPENSE' } as any)}
                className="flex items-center gap-2 bg-brand-primary text-white font-bold uppercase tracking-widest text-[10px] px-8 py-4 rounded-xl shadow-glow hover:bg-brand-primary/90 transition-all active:scale-95 cursor-pointer"
              >
                Registrar gasto
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredTransactions.map((tx, index) => {
              const Icon = ICON_MAP[tx.icon] || ShoppingBag;
              const isIncome = tx.type === 'income';
              const isConfirming = confirmDeleteId === tx.id;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all shrink-0 ${
                        isIncome ? 'text-emerald-500' : 'text-brand-primary'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 text-sm group-hover:text-brand-primary transition-colors truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {tx.date} {tx.time && `· ${tx.time}`} · {tx.category}{' '}
                        {isIncome && '· Ingreso'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right mr-1">
                      <p
                        className={`font-bold text-base tabular-nums ${
                          isIncome ? 'text-emerald-500' : 'text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount).split(' ')[0]}
                      </p>
                    </div>

                    {isConfirming ? (
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          title="Confirmar eliminación"
                          disabled={deletingId === tx.id}
                          onClick={() => handleConfirmDelete(tx.id)}
                          className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          title="Cancelar"
                          disabled={deletingId === tx.id}
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-2 rounded-lg bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          title="Editar movimiento"
                          onClick={() => onSelectTransaction(tx, true)}
                          className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar movimiento"
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}

                    <ChevronRight
                      size={18}
                      className="text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all hidden sm:block"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
