import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  Clock,
  Tag,
  CreditCard,
  AlignLeft,
  Utensils,
  Bus,
  Zap,
  ShoppingBag,
  Film,
  Banknote,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils';

interface DetailViewProps {
  transaction: Transaction;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  initialEditing?: boolean;
}

const ICON_MAP: Record<string, any> = { Utensils, Bus, Zap, ShoppingBag, Film, Banknote };

const EXPENSE_CATEGORIES = [
  { name: 'Alimentación', icon: 'Utensils' },
  { name: 'Transporte', icon: 'Bus' },
  { name: 'Servicios públicos', icon: 'Zap' },
  { name: 'Ropa y compras', icon: 'ShoppingBag' },
  { name: 'Entretenimiento', icon: 'Film' },
  { name: 'Otro', icon: 'ShoppingBag' },
];

const INCOME_CATEGORIES = [
  'Salario',
  'Trabajo independiente',
  'Negocio',
  'Inversiones',
  'Regalo',
  'Bonificación',
  'Reembolso',
  'Otro',
];

const PAYMENT_METHODS = ['Efectivo', 'Débito', 'Crédito', 'Cuenta bancaria', 'Nequi', 'Daviplata', 'Puntos', 'Otro'];

export default function DetailView({
  transaction,
  onBack,
  onUpdate,
  onDelete,
  initialEditing = false,
}: DetailViewProps) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState(transaction.category);
  const [isoDate, setIsoDate] = useState(
    transaction.isoDate || new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod || 'Efectivo');
  const [notes, setNotes] = useState(transaction.notes || '');

  useEffect(() => {
    setIsEditing(initialEditing);
    setConfirmingDelete(false);
    setError('');
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setCategory(transaction.category);
    setIsoDate(transaction.isoDate || new Date().toISOString().split('T')[0]);
    setPaymentMethod(transaction.paymentMethod || 'Efectivo');
    setNotes(transaction.notes || '');
  }, [transaction, initialEditing]);

  if (!transaction) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-40 text-center"
      >
        <p className="text-slate-500 font-medium italic">
          Selecciona un gasto en Movimientos para ver el detalle
        </p>
      </motion.div>
    );
  }

  const Icon = ICON_MAP[transaction.icon] || ShoppingBag;
  const isIncome = transaction.type === 'income';

  const availableExpenseCategories = EXPENSE_CATEGORIES.some((c) => c.name === category)
    ? EXPENSE_CATEGORIES
    : [{ name: category, icon: transaction.icon || 'ShoppingBag' }, ...EXPENSE_CATEGORIES];

  const availableIncomeCategories = INCOME_CATEGORIES.includes(category)
    ? INCOME_CATEGORIES
    : [category, ...INCOME_CATEGORIES];

  const handleSaveChanges = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('El monto debe ser mayor a cero.');
      return;
    }
    if (!description.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }

    const safeIso = /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
      ? isoDate
      : new Date().toISOString().split('T')[0];

    const formattedDate = new Date(`${safeIso}T12:00:00`).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const matchedIcon = isIncome
      ? 'Banknote'
      : availableExpenseCategories.find((c) => c.name === category)?.icon || transaction.icon || 'ShoppingBag';

    setError('');
    setIsSaving(true);
    try {
      await onUpdate(transaction.id, {
        amount: numAmount,
        description: description.trim(),
        category,
        isoDate: safeIso,
        date: formattedDate,
        icon: matchedIcon,
        paymentMethod,
        notes: notes.trim(),
      });
      setIsEditing(false);
    } catch {
      setError('No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setError('');
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
    } catch {
      setError('No se pudo eliminar el movimiento. Intenta de nuevo.');
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="p-2 bg-white/5 rounded-full group-hover:bg-brand-primary/10 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Volver</span>
        </button>

        <div className="flex items-center gap-2.5">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setConfirmingDelete(false);
                  setError('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-200 hover:bg-white/10 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Edit2 size={14} />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setError('');
                setAmount(String(transaction.amount));
                setDescription(transaction.description);
                setCategory(transaction.category);
                setIsoDate(transaction.isoDate || new Date().toISOString().split('T')[0]);
                setPaymentMethod(transaction.paymentMethod || 'Efectivo');
                setNotes(transaction.notes || '');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <X size={14} />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {confirmingDelete && !isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mb-6 border-rose-500/30 bg-rose-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <p className="text-sm font-semibold text-white">
              ¿Eliminar este {isIncome ? 'ingreso' : 'gasto'}?
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Esta acción actualizará tu presupuesto disponible y no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setConfirmingDelete(false)}
              className="px-3.5 py-2 rounded-lg bg-white/5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-500 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Sí, eliminar
            </button>
          </div>
        </motion.div>
      )}

      <div className="glass-card p-8">
        {!isEditing ? (
          <>
            <div className="flex flex-col items-center text-center mb-10">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center border mb-6 shadow-glow transition-all ${
                  isIncome
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                }`}
              >
                <Icon size={36} />
              </div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">
                {transaction.description}
              </h2>
              <p
                className={`text-4xl font-display font-bold tabular-nums ${
                  isIncome ? 'text-emerald-500' : 'text-gradient'
                }`}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>
              <span
                className={`text-xs font-semibold mt-2 ${
                  isIncome ? 'text-emerald-500' : 'text-slate-400'
                }`}
              >
                {isIncome ? 'Movimiento de Ingreso' : 'Movimiento de Gasto'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-slate-500">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Fecha
                    </p>
                    <p className="text-sm font-semibold text-slate-200">{transaction.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-slate-500">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Hora
                    </p>
                    <p className="text-sm font-semibold text-slate-200">
                      {transaction.time || 'No registrada'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-slate-500">
                    <Tag size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Categoría
                    </p>
                    <p className="text-sm font-semibold text-slate-200">{transaction.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-slate-500">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Método de Pago
                    </p>
                    <p className="text-sm font-semibold text-slate-200">
                      {transaction.paymentMethod || 'Efectivo'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-800 rounded-xl text-slate-500">
                  <AlignLeft size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Notas
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {transaction.notes || 'Sin notas adicionales para este movimiento.'}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-white">
                Editar {isIncome ? 'Ingreso' : 'Gasto'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Actualiza los datos y guarda los cambios en tu cuenta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Monto (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-lg font-display font-bold text-white tabular-nums focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  value={isoDate}
                  onChange={(e) => setIsoDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Descripción
              </label>
              <input
                type="text"
                maxLength={200}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError('');
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
                >
                  {(isIncome ? availableIncomeCategories : availableExpenseCategories.map((c) => c.name)).map(
                    (cat) => (
                      <option key={cat} value={cat} className="bg-brand-card text-white">
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Método de pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method} className="bg-brand-card text-white">
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Notas (opcional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles adicionales..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 px-4 bg-white/5 text-slate-300 font-semibold text-xs rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveChanges}
                className="flex-2 py-3 px-4 bg-brand-primary text-white font-semibold text-xs rounded-xl shadow-glow hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
