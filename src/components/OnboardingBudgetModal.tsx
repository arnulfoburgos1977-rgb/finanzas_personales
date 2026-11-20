import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { Wallet, ArrowRight, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { formatCurrency } from '../utils';

interface OnboardingBudgetModalProps {
  user: User;
  onConfirmBudget: (budget: number) => Promise<void>;
  onSignOut: () => Promise<void>;
}

const PRESETS = [1500000, 2500000, 3500000, 5000000];

export default function OnboardingBudgetModal({
  user,
  onConfirmBudget,
  onSignOut,
}: OnboardingBudgetModalProps) {
  const [budgetInput, setBudgetInput] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const displayName = user.displayName || user.email?.split('@')[0] || 'Usuario';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(budgetInput);
    if (budgetInput.trim() === '' || isNaN(numeric) || numeric < 0) {
      setError('Ingresa un presupuesto mensual válido en pesos colombianos.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await onConfirmBudget(numeric);
    } catch {
      setError('No pudimos guardar tu presupuesto. Intenta de nuevo.');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-300 flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-lg w-full p-8 md:p-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/15 border border-brand-primary/30 text-brand-primary flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>

        <div className="mb-6">
          <p className="text-xs font-medium text-brand-primary mb-1">
            ¡Bienvenido, {displayName}!
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white text-balance">
            ¿Cuál es tu presupuesto mensual?
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Como es tu primera vez aquí, tu cuenta empieza desde cero. Define cuánto dinero tienes presupuestado para este mes y podrás ajustarlo cuando quieras.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Presupuesto mensual (COP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary font-bold text-xl">
                $
              </span>
              <input
                type="number"
                min={0}
                step={1000}
                value={budgetInput}
                onChange={(e) => {
                  setBudgetInput(e.target.value);
                  setError('');
                }}
                placeholder="Ej. 2500000"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-16 text-2xl font-display font-bold text-white tabular-nums focus:outline-none focus:border-brand-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
                COP
              </span>
            </div>

            {budgetInput && !isNaN(Number(budgetInput)) && Number(budgetInput) >= 0 && (
              <p className="text-xs text-slate-400 mt-2 tabular-nums">
                Equivalente a <span className="text-white font-semibold">{formatCurrency(Number(budgetInput))}</span>
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">Sugerencias rápidas</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setBudgetInput(String(preset));
                    setError('');
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                    Number(budgetInput) === preset
                      ? 'bg-brand-primary/15 border-brand-primary text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {formatCurrency(preset).replace(' COP', '')}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 px-4 bg-brand-primary text-white font-semibold text-sm rounded-xl shadow-glow hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Guardar presupuesto y comenzar</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
