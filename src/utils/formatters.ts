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
        bgClass: 'bg-[#FBF3DB] dark:bg-[#332A15]',
        textClass: 'text-[#956400] dark:text-[#E8CA65]',
        borderClass: 'border-[#F4E3B4] dark:border-[#4D3F1E]',
        dotClass: 'bg-[#956400]',
      };
    case 'APPROVED':
      return {
        label: 'Disetujui Penuh',
        bgClass: 'bg-[#EDF3EC] dark:bg-[#172B19]',
        textClass: 'text-[#346538] dark:text-[#96D99C]',
        borderClass: 'border-[#D4E5D3] dark:border-[#223F25]',
        dotClass: 'bg-[#346538]',
      };
    case 'PARTIAL':
      return {
        label: 'Disetujui Sebagian',
        bgClass: 'bg-[#FBF3DB] dark:bg-[#332A15]',
        textClass: 'text-[#956400] dark:text-[#E8CA65]',
        borderClass: 'border-[#F4E3B4] dark:border-[#4D3F1E]',
        dotClass: 'bg-[#956400]',
      };
    case 'IN_TRANSIT':
      return {
        label: 'Dalam Pengiriman',
        bgClass: 'bg-[#E1F3FE] dark:bg-[#142838]',
        textClass: 'text-[#1F6C9F] dark:text-[#97D2FB]',
        borderClass: 'border-[#C8E7FD] dark:border-[#1E3B52]',
        dotClass: 'bg-[#1F6C9F]',
      };
    case 'COMPLETED':
      return {
        label: 'Selesai (Sesuai)',
        bgClass: 'bg-[#EDF3EC] dark:bg-[#172B19]',
        textClass: 'text-[#346538] dark:text-[#96D99C]',
        borderClass: 'border-[#D4E5D3] dark:border-[#223F25]',
        dotClass: 'bg-[#346538]',
      };
    case 'DISCREPANCY':
      return {
        label: 'Ada Selisih / Kerusakan',
        bgClass: 'bg-[#FDEBEC] dark:bg-[#381B1B]',
        textClass: 'text-[#9F2F2D] dark:text-[#F8A4A4]',
        borderClass: 'border-[#F8D2D4] dark:border-[#522525]',
        dotClass: 'bg-[#9F2F2D]',
      };
    case 'REJECTED':
      return {
        label: 'Ditolak',
        bgClass: 'bg-[#FDEBEC] dark:bg-[#381B1B]',
        textClass: 'text-[#9F2F2D] dark:text-[#F8A4A4]',
        borderClass: 'border-[#F8D2D4] dark:border-[#522525]',
        dotClass: 'bg-[#9F2F2D]',
      };
    default:
      return {
        label: status,
        bgClass: 'bg-[#F7F6F3] dark:bg-[#1C1E22]',
        textClass: 'text-[#787774] dark:text-[#A1A09E]',
        borderClass: 'border-[#EAEAEA] dark:border-[#26282E]',
        dotClass: 'bg-[#787774]',
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
      return { label: 'Barang Masuk', bgClass: 'bg-[#EDF3EC] dark:bg-[#172B19]', textClass: 'text-[#346538] dark:text-[#96D99C]' };
    case 'TRANSFER_DISPATCH':
      return { label: 'Dikirim ke Toko', bgClass: 'bg-[#E1F3FE] dark:bg-[#142838]', textClass: 'text-[#1F6C9F] dark:text-[#97D2FB]' };
    case 'TRANSFER_RECEIVE':
      return { label: 'Diterima Toko', bgClass: 'bg-[#EDF3EC] dark:bg-[#172B19]', textClass: 'text-[#346538] dark:text-[#96D99C]' };
    case 'DAMAGE_LOSS':
      return { label: 'Rusak / Hilang', bgClass: 'bg-[#FDEBEC] dark:bg-[#381B1B]', textClass: 'text-[#9F2F2D] dark:text-[#F8A4A4]' };
    case 'MANUAL_ADJUSTMENT':
      return { label: 'Penyesuaian', bgClass: 'bg-[#FBF3DB] dark:bg-[#332A15]', textClass: 'text-[#956400] dark:text-[#E8CA65]' };
    default:
      return { label: type, bgClass: 'bg-[#F7F6F3] dark:bg-[#1C1E22]', textClass: 'text-[#787774] dark:text-[#A1A09E]' };
  }
}
