import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle, CheckCircle2, Banknote, Calendar, CreditCard, AlignLeft } from 'lucide-react';
import { formatCurrency } from '../utils';

interface AddIncomeViewProps {
  onClose: () => void;
  onSave: (income: any) => void;
}

const CATEGORIES = [
  'Salario',
  'Trabajo independiente',
  'Negocio',
  'Inversiones',
  'Regalo',
  'Bonificación',
  'Reembolso',
  'Otro',
];

const PAYMENT_METHODS = [
  'Efectivo',
  'Cuenta bancaria',
  'Nequi',
  'Daviplata',
  'Tarjeta',
  'Otro',
];

export default function AddIncomeView({ onClose, onSave }: AddIncomeViewProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Salario');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('El valor del ingreso debe ser mayor a cero.');
      return;
    }
    if (!description.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }

    setIsSuccess(true);
    
    setTimeout(() => {
      onSave({
        id: Date.now().toString(),
        type: 'income',
        amount: numAmount,
        description,
        category,
        paymentMethod,
        date: new Date(`${date}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
        isoDate: date,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        notes,
        icon: 'Banknote',
      });
    }, 1500);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">¡Éxito!</h2>
        <p className="text-slate-400">Ingreso registrado correctamente.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 max-w-2xl mx-auto overflow-hidden relative"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Registrar Nuevo Ingreso</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Aumentar presupuesto mensual</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <Banknote size={12} className="text-emerald-500" /> Valor del ingreso (COP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-2xl font-display font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
              {amount && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600">
                  COP
                </div>
              )}
            </div>
            {amount && !isNaN(Number(amount)) && (
                <p className="text-[10px] text-emerald-500/70 font-bold mt-2 ml-1">
                  Format: {formatCurrency(Number(amount))}
                </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError('');
              }}
              placeholder="Ej. Salario, Freelance..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-brand-primary/50 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-brand-primary/50 transition-colors appearance-none cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-brand-card">{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {/* Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <Calendar size={12} /> Fecha del ingreso
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-brand-primary/50 transition-colors appearance-none cursor-pointer"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <CreditCard size={12} /> Medio de pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-brand-primary/50 transition-colors appearance-none cursor-pointer"
            >
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method} className="bg-brand-card">{method}</option>
              ))}
            </select>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <AlignLeft size={12} /> Observaciones (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-brand-primary/50 transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-2 py-4 bg-brand-primary text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_20px_rgba(91,61,245,0.3)] hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <Save size={16} className="group-hover:scale-110 transition-transform" />
            Guardar Ingreso
          </button>
        </div>
      </div>
    </motion.div>
  );
}
