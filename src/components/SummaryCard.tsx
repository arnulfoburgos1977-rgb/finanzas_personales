import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, LineChart } from 'lucide-react';
import { formatCurrency } from '../utils';
import { BudgetSummary } from '../types';

interface SummaryCardProps {
  summary: BudgetSummary;
  onUpdateBudget: (value: number) => void;
}

export default function SummaryCard({ summary, onUpdateBudget }: SummaryCardProps) {
  const [draftBudget, setDraftBudget] = useState(String(summary.monthlyBudget));

  useEffect(() => {
    setDraftBudget(String(summary.monthlyBudget));
  }, [summary.monthlyBudget]);

  const commitBudget = () => {
    const parsed = Number(draftBudget);
    if (!isNaN(parsed) && parsed >= 0 && parsed !== summary.monthlyBudget) {
      onUpdateBudget(parsed);
    } else {
      setDraftBudget(String(summary.monthlyBudget));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Monthly Budget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex flex-col h-32 justify-between group"
      >
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Presupuesto Mensual</p>
          <div className="p-1.5 bg-white/5 rounded-lg text-slate-500 group-hover:text-brand-primary transition-colors">
            <Wallet size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-white">$</span>
          <input
            type="number"
            min={0}
            value={draftBudget}
            onChange={(e) => setDraftBudget(e.target.value)}
            onBlur={commitBudget}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="bg-transparent text-3xl font-display font-bold text-white tabular-nums w-full focus:outline-none border-b border-transparent focus:border-brand-primary/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[10px] text-slate-500 font-normal uppercase tracking-widest">COP</span>
        </div>
      </motion.div>

      {/* Total Spent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 flex flex-col h-32 justify-between"
      >
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Gastado</p>
          <div className="p-1.5 bg-white/5 rounded-lg text-slate-500">
            <LineChart size={14} />
          </div>
        </div>
        <h2 className="text-3xl font-display font-bold text-white">
          {formatCurrency(summary.totalSpent).split(' ')[0]} <span className="text-[10px] text-slate-500 font-normal uppercase tracking-widest">COP</span>
        </h2>
      </motion.div>

      {/* Available Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 flex flex-col h-32 justify-between border-brand-primary/20 shadow-glow"
      >
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Saldo Disponible</p>
          <div className="p-1.5 bg-white/5 rounded-lg text-slate-500">
            <TrendingUp size={14} />
          </div>
        </div>
        <h2 className="text-3xl font-display font-bold text-white">
          {formatCurrency(summary.availableBalance).split(' ')[0]} <span className="text-[10px] text-slate-500 font-normal uppercase tracking-widest">COP</span>
        </h2>
      </motion.div>
    </div>
  );
}
