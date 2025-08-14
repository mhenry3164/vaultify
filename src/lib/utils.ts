import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    electronics: '📱',
    jewelry: '💎',
    furniture: '🪑',
    appliances: '🏠',
    clothing: '👕',
    art: '🖼️',
    books: '📚',
    tools: '🔧',
    sports: '⚽',
    other: '📦',
  };
  
  return icons[category] || icons.other;
}

export function formatValueRange(value: { low: number; high: number; currency: string }) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: value.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  if (value.low === value.high) {
    return formatter.format(value.low);
  }
  
  return `${formatter.format(value.low)} - ${formatter.format(value.high)}`;
}
