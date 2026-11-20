import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Transaction } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' COP';
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    amount: 125000,
    category: 'Servicios públicos',
    date: '27 de jun, 2026',
    time: '04:20 PM',
    description: 'Pago de servicios públicos',
    icon: 'Zap',
    notes: 'Pago de energía y agua del mes de junio.',
    paymentMethod: 'Débito'
  },
  {
    id: '2',
    type: 'expense',
    amount: 45000,
    category: 'Alimentación',
    date: '26 de jun, 2026',
    time: '04:20 PM',
    description: 'Cena familiar',
    icon: 'Utensils',
    notes: 'Restaurante Crepes & Waffles.',
    paymentMethod: 'Efectivo'
  },
  {
    id: '3',
    type: 'expense',
    amount: 38500,
    category: 'Transporte',
    date: '25 de jun, 2026',
    time: '04:20 PM',
    description: 'Recarga tarjeta transporte',
    icon: 'Bus',
    notes: 'Recarga para la semana.',
    paymentMethod: 'Efectivo'
  },
  {
    id: '4',
    type: 'expense',
    amount: 89000,
    category: 'Ropa y compras',
    date: '24 de jun, 2026',
    time: '11:15 AM',
    description: 'Camiseta deportiva',
    icon: 'ShoppingBag',
    notes: 'Compra en Decathlon.',
    paymentMethod: 'Crédito'
  },
  {
    id: '5',
    type: 'expense',
    amount: 55000,
    category: 'Entretenimiento',
    date: '23 de jun, 2026',
    time: '08:45 PM',
    description: 'Boletas de cine',
    icon: 'Film',
    notes: 'Película de estreno.',
    paymentMethod: 'Puntos'
  }
];

export const MOCK_DAILY_SPENDING = [
  { day: 1, amount: 15000, isAverage: true },
  { day: 4, amount: 45000, isAverage: true },
  { day: 7, amount: 80000, isAverage: true },
  { day: 8, amount: 180000, isAverage: false },
  { day: 10, amount: 40000, isAverage: true },
  { day: 11, amount: 250000, isAverage: false },
  { day: 13, amount: 70000, isAverage: false },
  { day: 14, amount: 120000, isAverage: false },
  { day: 16, amount: 60000, isAverage: false },
  { day: 18, amount: 45000, isAverage: true },
  { day: 20, amount: 30000, isAverage: true },
  { day: 22, amount: 20000, isAverage: true },
  { day: 24, amount: 140000, isAverage: false },
  { day: 26, amount: 10000, isAverage: true },
  { day: 27, amount: 75000, isAverage: true },
  { day: 29, amount: 50000, isAverage: true },
  { day: 30, amount: 25000, isAverage: true },
].map(d => ({ ...d, average: d.isAverage ? d.amount : 0, actual: d.isAverage ? 0 : d.amount }));

export const MOCK_SUMMARY = {
  monthlyBudget: 3500000,
  totalSpent: 2150000,
  availableBalance: 1350000,
  percentSpent: (2150000 / 3500000) * 100, // 61.4%
};
