import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils';

interface AddExpenseViewProps {
  onClose: () => void;
  onSave: (expense: any) => void;
}

const CATEGORIES = [
  { name: 'Alimentación', icon: 'Utensils', color: 'text-orange-400' },
  { name: 'Transporte', icon: 'Bus', color: 'text-blue-400' },
  { name: 'Servicios públicos', icon: 'Zap', color: 'text-amber-400' },
  { name: 'Ropa y compras', icon: 'ShoppingBag', color: 'text-purple-400' },
  { name: 'Entretenimiento', icon: 'Film', color: 'text-rose-400' },
];

export default function AddExpenseView({ onClose, onSave }: AddExpenseViewProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Por favor ingresa un monto válido.');
      return;
    }
    if (!description) {
      setError('La descripción es obligatoria.');
      return;
    }

    const selectedCategory = CATEGORIES.find(c => c.name === category);

    const now = new Date();
    onSave({
      id: Date.now().toString(),
      amount: Number(amount),
      description,
      category,
      icon: selectedCategory?.icon || 'ShoppingBag',
      date: now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
      isoDate: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-8 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold text-white">Registrar Gasto</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Monto (COP)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary font-bold">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-2xl font-display font-bold text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
            placeholder="¿En qué gastaste?"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Categoría</label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  category === cat.name
                    ? 'bg-brand-primary/10 border-brand-primary text-white shadow-glow'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'
                }`}
              >
                <span className={cat.color}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

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

        <div className="pt-4">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-brand-primary text-white font-bold uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <Save size={20} className="group-hover:scale-110 transition-transform" />
            Guardar Gasto
          </button>
        </div>
      </div>
    </motion.div>
  );
}
