import { motion } from 'motion/react';
import { formatCurrency } from '../utils';
import { BudgetSummary } from '../types';

interface BudgetProgressProps {
  summary: BudgetSummary;
}

export default function BudgetProgress({ summary }: BudgetProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-display font-bold text-white">Progreso del Presupuesto</h3>
        <p className="text-sm">
          <span className="text-brand-primary font-bold">{Math.round(summary.percentSpent * 10) / 10}%</span>
          <span className="text-slate-500 ml-1">del presupuesto utilizado</span>
        </p>
      </div>
      
      <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${summary.percentSpent}%` }}
          className="h-full bg-brand-primary rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-slate-500">
          Día {new Date().getDate()} de {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
        </span>
        <span className="text-slate-500 tabular-nums">
          QUEDAN <span className="text-slate-300 mx-1">{formatCurrency(summary.availableBalance)}</span> PARA EL RESTO DEL MES
        </span>
      </div>
    </motion.div>
  );
}
