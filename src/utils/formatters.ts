import { TransferRequestStatus, TransactionType } from '../types';

export function formatDate(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateShort(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function getStatusBadgeConfig(status: TransferRequestStatus): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Menunggu Persetujuan',
        bgClass: 'bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/60 dark:to-amber-900/40',
        textClass: 'text-amber-800 dark:text-amber-300 font-semibold',
        borderClass: 'border-amber-300 dark:border-amber-700/60 shadow-2xs',
        dotClass: 'bg-amber-500 ring-2 ring-amber-400/30',
      };
    case 'APPROVED':
      return {
        label: 'Disetujui Penuh',
        bgClass: 'bg-gradient-to-r from-emerald-50 to-emerald-100/70 dark:from-emerald-950/60 dark:to-emerald-900/40',
        textClass: 'text-emerald-800 dark:text-emerald-300 font-semibold',
        borderClass: 'border-emerald-300 dark:border-emerald-700/60 shadow-2xs',
        dotClass: 'bg-emerald-500 ring-2 ring-emerald-400/30',
      };
    case 'PARTIAL':
      return {
        label: 'Disetujui Sebagian',
        bgClass: 'bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/60 dark:to-amber-900/40',
        textClass: 'text-amber-800 dark:text-amber-300 font-semibold',
        borderClass: 'border-amber-300 dark:border-amber-700/60 shadow-2xs',
        dotClass: 'bg-amber-500 ring-2 ring-amber-400/30',
      };
    case 'IN_TRANSIT':
      return {
        label: 'Dalam Pengiriman',
        bgClass: 'bg-gradient-to-r from-sky-50 to-blue-100/70 dark:from-sky-950/60 dark:to-blue-900/40',
        textClass: 'text-sky-800 dark:text-sky-300 font-semibold',
        borderClass: 'border-sky-300 dark:border-sky-700/60 shadow-2xs',
        dotClass: 'bg-sky-500 ring-2 ring-sky-400/30',
      };
    case 'COMPLETED':
      return {
        label: 'Selesai (Sesuai)',
        bgClass: 'bg-gradient-to-r from-emerald-50 to-emerald-100/70 dark:from-emerald-950/60 dark:to-emerald-900/40',
        textClass: 'text-emerald-800 dark:text-emerald-300 font-semibold',
        borderClass: 'border-emerald-300 dark:border-emerald-700/60 shadow-2xs',
        dotClass: 'bg-emerald-500 ring-2 ring-emerald-400/30',
      };
    case 'DISCREPANCY':
      return {
        label: 'Ada Selisih / Kerusakan',
        bgClass: 'bg-gradient-to-r from-rose-50 to-rose-100/70 dark:from-rose-950/60 dark:to-rose-900/40',
        textClass: 'text-rose-800 dark:text-rose-300 font-semibold',
        borderClass: 'border-rose-300 dark:border-rose-700/60 shadow-2xs',
        dotClass: 'bg-rose-500 ring-2 ring-rose-400/30',
      };
    case 'REJECTED':
      return {
        label: 'Ditolak',
        bgClass: 'bg-gradient-to-r from-rose-50 to-rose-100/70 dark:from-rose-950/60 dark:to-rose-900/40',
        textClass: 'text-rose-800 dark:text-rose-300 font-semibold',
        borderClass: 'border-rose-300 dark:border-rose-700/60 shadow-2xs',
        dotClass: 'bg-rose-500 ring-2 ring-rose-400/30',
      };
    default:
      return {
        label: status,
        bgClass: 'bg-muted/80',
        textClass: 'text-foreground font-medium',
        borderClass: 'border-border shadow-2xs',
        dotClass: 'bg-muted-foreground',
      };
  }
}

export function getTransactionTypeBadge(type: TransactionType): {
  label: string;
  bgClass: string;
  textClass: string;
} {
  switch (type) {
    case 'PURCHASE_INBOUND':
      return { 
        label: 'Barang Masuk', 
        bgClass: 'bg-gradient-to-r from-emerald-50 to-emerald-100/70 border border-emerald-300 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:border-emerald-700/50', 
        textClass: 'text-emerald-800 dark:text-emerald-300 font-medium' 
      };
    case 'TRANSFER_DISPATCH':
      return { 
        label: 'Dikirim ke Toko', 
        bgClass: 'bg-gradient-to-r from-sky-50 to-blue-100/70 border border-sky-300 dark:from-sky-950/60 dark:to-blue-900/40 dark:border-sky-700/50', 
        textClass: 'text-sky-800 dark:text-sky-300 font-medium' 
      };
    case 'TRANSFER_RECEIVE':
      return { 
        label: 'Diterima Toko', 
        bgClass: 'bg-gradient-to-r from-emerald-50 to-emerald-100/70 border border-emerald-300 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:border-emerald-700/50', 
        textClass: 'text-emerald-800 dark:text-emerald-300 font-medium' 
      };
    case 'DAMAGE_LOSS':
      return { 
        label: 'Rusak / Hilang', 
        bgClass: 'bg-gradient-to-r from-rose-50 to-rose-100/70 border border-rose-300 dark:from-rose-950/60 dark:to-rose-900/40 dark:border-rose-700/50', 
        textClass: 'text-rose-800 dark:text-rose-300 font-medium' 
      };
    case 'MANUAL_ADJUSTMENT':
      return { 
        label: 'Penyesuaian', 
        bgClass: 'bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300 dark:from-amber-950/60 dark:to-amber-900/40 dark:border-amber-700/50', 
        textClass: 'text-amber-800 dark:text-amber-300 font-medium' 
      };
    default:
      return { 
        label: type, 
        bgClass: 'bg-muted border border-border', 
        textClass: 'text-muted-foreground' 
      };
  }
}
