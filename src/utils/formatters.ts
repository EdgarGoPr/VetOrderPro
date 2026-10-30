import type { ProductUnit } from '../types';

/**
 * Formats a quantity with its natural language unit in Spanish (singular/plural)
 * e.g.:
 * 1 unidad -> "1 unidad"
 * 3 unidad -> "3 unidades"
 * 1 caja   -> "1 caja"
 * 4 caja   -> "4 cajas"
 * 1 dosis  -> "1 dosis"
 * 50 dosis -> "50 dosis"
 */
export function formatUnitNatural(cantidad: number, unidad: ProductUnit): string {
  const qty = Number(cantidad) || 0;
  const u = (unidad || '').toLowerCase().trim();
  
  if (u === 'unidad') {
    return qty === 1 ? '1 unidad' : `${qty} unidades`;
  }
  if (u === 'caja') {
    return qty === 1 ? '1 caja' : `${qty} cajas`;
  }
  if (u === 'dosis') {
    return qty === 1 ? '1 dosis' : `${qty} dosis`;
  }
  if (u === 'frasco') {
    return qty === 1 ? '1 frasco' : `${qty} frascos`;
  }
  if (u === 'bidon' || u === 'bidón') {
    return qty === 1 ? '1 bidón' : `${qty} bidones`;
  }
  if (u === 'bolsa') {
    return qty === 1 ? '1 bolsa' : `${qty} bolsas`;
  }
  if (u === 'balde') {
    return qty === 1 ? '1 balde' : `${qty} baldes`;
  }
  if (u === 'pomo') {
    return qty === 1 ? '1 pomo' : `${qty} pomos`;
  }
  return `${qty} ${unidad}`;
}

/**
 * Formats full item quantity with presentation in parentheses if available
 * e.g. "50 dosis (frasco 100 ml)" or "2 cajas (caja x 12)"
 */
export function formatFullItemQuantity(cantidad: number, unidad: ProductUnit, presentacion?: string): string {
  const unitStr = formatUnitNatural(cantidad, unidad);
  if (presentacion && presentacion.trim()) {
    return `${unitStr} (${presentacion.trim()})`;
  }
  return unitStr;
}

/**
 * Formats an ISO date string (YYYY-MM-DD or full ISO) into localized Argentine/Spanish date
 */
export function formatDate(dateStr: string, format: 'short' | 'long' | 'printable' = 'short'): string {
  if (!dateStr) return '';
  // Ensure we avoid timezone offset issues by splitting YYYY-MM-DD
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (format === 'printable') {
    // Format: "29 / 10 / 2026"
    const dd = String(day).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    return `${dd} / ${mm} / ${year}`;
  }

  if (format === 'long') {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${day} de ${months[month]} de ${year}`;
  }

  // Short: "29/10/2026"
  const dd = String(day).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

/**
 * Returns distinct, harmonious colors for laboratory badges
 */
export function getLaboratoryBadgeStyle(labName?: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  if (!labName || !labName.trim()) {
    return {
      bg: 'bg-stone-100',
      text: 'text-stone-700',
      border: 'border-stone-300',
      dot: 'bg-stone-500',
    };
  }

  const name = labName.toLowerCase();

  if (name.includes('biogénesis') || name.includes('biogenesis') || name.includes('bago') || name.includes('bagó')) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-600',
    };
  }
  if (name.includes('zoetis')) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    };
  }
  if (name.includes('boehringer') || name.includes('ingelheim')) {
    return {
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      dot: 'bg-sky-600',
    };
  }
  if (name.includes('msd') || name.includes('merck')) {
    return {
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      dot: 'bg-teal-600',
    };
  }
  if (name.includes('ceva')) {
    return {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      dot: 'bg-indigo-600',
    };
  }
  if (name.includes('elanco')) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dot: 'bg-blue-600',
    };
  }
  if (name.includes('konig') || name.includes('könig')) {
    return {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-600',
    };
  }

  // Hash code fallback for custom laboratories to generate consistent subtle colors
  let hash = 0;
  for (let i = 0; i < labName.length; i++) {
    hash = labName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-600' },
    { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
    { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-600' },
    { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-600' },
    { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300', dot: 'bg-stone-500' },
    { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200', dot: 'bg-violet-600' },
  ];
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

/**
 * Returns initials from account name if not explicitly set
 */
export function generateInitials(name: string): string {
  if (!name) return 'VET';
  const clean = name.trim().split(/\s+/);
  if (clean.length === 1) {
    return clean[0].substring(0, 3).toUpperCase();
  }
  return clean.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}
