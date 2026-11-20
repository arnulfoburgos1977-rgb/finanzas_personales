import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailySpending } from '../types';

interface SpendingChartProps {
  data: DailySpending[];
}

export default function SpendingChart({ data }: SpendingChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const isActual = payload[0].payload.actual > 0;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-3 border border-white/10 rounded-xl shadow-2xl">
          <p className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Día {payload[0].payload.day}</p>
          <p className={`text-sm font-bold ${isActual ? 'text-brand-primary' : 'text-slate-400'}`}>
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payload[0].value)} <span className="text-[8px] font-normal uppercase ml-1">COP</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-display font-bold text-white">Gastos Diarios (COP)</h3>
          <p className="text-xs text-slate-500 font-medium">Comportamiento mensual</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span> Promedio
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-brand-primary"></span> Gasto Real
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
              dy={10}
              interval={2}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
              tickFormatter={(value) => `$${value/1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
              {data.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.actual > 0 ? '#F97316' : '#1E293B'} 
                  fillOpacity={0.8}
                  className="hover:fill-opacity-100 transition-all duration-300"
                  style={{ filter: entry.actual > 0 ? 'drop-shadow(0 0 5px rgba(249, 115, 22, 0.4))' : 'none' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
