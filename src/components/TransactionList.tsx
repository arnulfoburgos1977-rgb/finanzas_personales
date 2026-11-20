import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Utensils,
  Bus,
  Zap,
  ShoppingBag,
  Film,
  ArrowRight,
  Banknote,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';

interface TransactionListProps {
  transactions: Transaction[];
  onSeeAll?: () => void;
  onSelectTransaction?: (tx: Transaction, editMode?: boolean) => void;
  onDeleteTransaction?: (id: string) => Promise<void>;
}

const ICON_MAP: Record<string, any> = {
  Utensils,
  Bus,
  Zap,
  ShoppingBag,
  Film,
  Banknote,
};

export default function TransactionList({
  transactions,
  onSeeAll,
  onSelectTransaction,
  onDeleteTransaction,
}: TransactionListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleConfirmDelete = async (id: string) => {
    if (!onDeleteTransaction) return;
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card flex flex-col h-full overflow-hidden"
    >
      <div className="p-6">
        <h3 className="text-lg font-display font-bold text-white">Últimos Movimientos</h3>
        <p className="text-xs text-slate-500 font-medium">Tus movimientos más recientes</p>
      </div>

      <div className="flex-1 px-6 space-y-4">
        {transactions.map((tx, index) => {
          const Icon = ICON_MAP[tx.icon] || ShoppingBag;
          const isIncome = tx.type === 'income';
          const isConfirming = confirmDeleteId === tx.id;
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              onClick={() => onSelectTransaction?.(tx)}
              className="flex items-center justify-between gap-3 group cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all shrink-0 ${
                    isIncome ? 'text-emerald-500' : 'text-brand-primary'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-200 text-sm group-hover:text-brand-primary transition-colors truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {tx.date} {isIncome && '· Ingreso'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p
                    className={`font-bold text-sm tabular-nums ${
                      isIncome ? 'text-emerald-500' : 'text-white'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount).split(' ')[0]}
                  </p>
                </div>

                {isConfirming ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title="Confirmar eliminación"
                      disabled={deletingId === tx.id}
                      onClick={() => handleConfirmDelete(tx.id)}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      title="Cancelar"
                      disabled={deletingId === tx.id}
                      onClick={() => setConfirmDeleteId(null)}
                      className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => onSelectTransaction?.(tx, true)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                    {onDeleteTransaction && (
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => setConfirmDeleteId(tx.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-6">
        <button
          onClick={onSeeAll}
          className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-brand-primary/80 flex items-center justify-center gap-1.5 transition-colors group cursor-pointer"
        >
          Ver todos los movimientos{' '}
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
