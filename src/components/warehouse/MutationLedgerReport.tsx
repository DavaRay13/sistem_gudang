import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { TransactionType } from '../../types';
import { TransactionBadge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { 
  BookOpen, Download, Search, 
  ArrowUpRight, ArrowDownRight, AlertTriangle, 
  CheckCircle, Printer, FileText, Loader2
} from 'lucide-react';
import { formatDate, formatNumber, getTransactionTypeBadge } from '../../utils/formatters';
import { exportMutationsToExcel, exportMutationsToPdf } from '../../utils/exportHelpers';

export const MutationLedgerReport: React.FC = () => {
  const { mutations, items, requests } = useInventory();
  const { locations, users, currentUser } = useAuth();

  // Filters State
  const [storeFilter, setStoreFilter] = useState<number | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [timeRange, setTimeRange] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const itemMap = new Map(items.map(i => [i.id, i]));
  const locMap = new Map(locations.map(l => [l.id, l]));

  // Filter mutations
  const filteredMutations = mutations.filter(m => {
    if (storeFilter !== 'ALL') {
      if (m.from_location_id !== storeFilter && m.to_location_id !== storeFilter) {
        return false;
      }
    }

    if (typeFilter !== 'ALL' && m.transaction_type !== typeFilter) {
      return false;
    }

    if (timeRange !== 'ALL') {
      const date = new Date(m.created_at).getTime();
      const now = Date.now();
      if (timeRange === 'TODAY') {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        if (date < todayStart) return false;
      } else if (timeRange === '7DAYS') {
        if (now - date > 86400000 * 7) return false;
      } else if (timeRange === '30DAYS') {
        if (now - date > 86400000 * 30) return false;
      }
    }

    if (searchTerm.trim()) {
      const item = itemMap.get(m.item_id);
      const search = searchTerm.toLowerCase();
      const matchName = item?.name.toLowerCase().includes(search);
      const matchRef = m.reference_code?.toLowerCase().includes(search);
      const matchNotes = m.notes?.toLowerCase().includes(search);
      if (!matchName && !matchRef && !matchNotes) return false;
    }

    return true;
  });

  // Calculate KPIs
  const totalInboundQty = filteredMutations
    .filter(m => m.transaction_type === 'PURCHASE_INBOUND')
    .reduce((sum, m) => sum + m.qty, 0);

  const totalDispatchQty = filteredMutations
    .filter(m => m.transaction_type === 'TRANSFER_DISPATCH')
    .reduce((sum, m) => sum + m.qty, 0);

  const totalDamageLossQty = filteredMutations
    .filter(m => m.transaction_type === 'DAMAGE_LOSS')
    .reduce((sum, m) => sum + m.qty, 0);

  const evaluatedRequests = requests.filter(r => r.status !== 'PENDING' && r.status !== 'REJECTED');
  const totalRequested = evaluatedRequests.reduce(
    (sum, r) => sum + r.items.reduce((iSum, item) => iSum + item.qty_requested, 0),
    0
  );
  const totalApproved = evaluatedRequests.reduce(
    (sum, r) => sum + r.items.reduce((iSum, item) => iSum + (item.qty_dispatched || item.qty_approved), 0),
    0
  );
  const fulfillmentRate = totalRequested > 0 ? ((totalApproved / totalRequested) * 100).toFixed(1) : '100.0';

  const getExportMeta = () => {
    const storeLabel =
      storeFilter === 'ALL'
        ? 'Semua Lokasi / Cabang'
        : locMap.get(storeFilter)?.name || `Lokasi #${storeFilter}`;
    const typeLabel =
      typeFilter === 'ALL'
        ? 'Semua Tipe Transaksi'
        : getTransactionTypeBadge(typeFilter).label;
    const timeLabel =
      timeRange === 'ALL'
        ? 'Semua Waktu'
        : timeRange === 'TODAY'
        ? 'Hari Ini'
        : timeRange === '7DAYS'
        ? '7 Hari Terakhir'
        : '30 Hari Terakhir';

    return {
      storeFilterLabel: storeLabel,
      typeFilterLabel: typeLabel,
      timeRangeLabel: timeLabel,
      adminName: currentUser?.full_name || 'Admin Gudang Pusat',
    };
  };

  const handleExportExcel = () => {
    exportMutationsToExcel(filteredMutations, items, locations, users, getExportMeta());
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    // Timeout microtask to let UI reflect loading state immediately
    setTimeout(() => {
      try {
        exportMutationsToPdf(filteredMutations, items, locations, users, getExportMeta());
      } catch (err) {
        console.error('Gagal export PDF mutasi:', err);
      } finally {
        setIsExportingPdf(false);
      }
    }, 50);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            <span>Riwayat Keluar Masuk Barang</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            {filteredMutations.length} catatan keluar masuk barang
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {/* Tombol Cetak Langsung Browser */}
          <button
            onClick={handlePrint}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 active:scale-95 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Cetak Langsung (Browser Print)"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Tombol Export Dokumen PDF Resmi */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || filteredMutations.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-sm active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap"
            title="Download Dokumen PDF Laporan Mutasi Berformat Tabel"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>PDF</span>
          </button>

          {/* Tombol Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={filteredMutations.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap"
            title="Download Spreadsheet Excel Data Mutasi"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* KPI - Horizontal scroll on mobile, grid on desktop */}
      <div className="flex lg:grid lg:grid-cols-4 gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 snap-x snap-mandatory">
        <div className="min-w-[140px] sm:min-w-0 snap-start">
          <StatCard
            title="Barang Masuk"
            value={`${formatNumber(totalInboundQty)}`}
            subtitle="Stok Tambahan Masuk"
            icon={ArrowDownRight}
            color="emerald"
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 snap-start">
          <StatCard
            title="Barang Keluar"
            value={`${formatNumber(totalDispatchQty)}`}
            subtitle="Dikirim ke Toko"
            icon={ArrowUpRight}
            color="indigo"
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 snap-start">
          <StatCard
            title="Rusak / Hilang"
            value={`${formatNumber(totalDamageLossQty)}`}
            subtitle="Selisih saat diterima"
            icon={AlertTriangle}
            color="rose"
          />
        </div>
        <div className="min-w-[140px] sm:min-w-0 snap-start">
          <StatCard
            title="Pemenuhan"
            value={`${fulfillmentRate}%`}
            subtitle="Permintaan terpenuhi"
            icon={CheckCircle}
            color="blue"
          />
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-sm space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama barang, nomor referensi, atau catatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <select
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">Semua Cabang</option>
            <option value={1}>Toko 1</option>
            <option value={2}>Toko 2</option>
            <option value={3}>Toko 3</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">Semua Tipe</option>
            <option value="PURCHASE_INBOUND">Barang Masuk</option>
            <option value="TRANSFER_DISPATCH">Barang Keluar</option>
            <option value="TRANSFER_RECEIVE">Diterima Toko</option>
            <option value="DAMAGE_LOSS">Rusak / Hilang</option>
          </select>

          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as any)}
            className="col-span-2 sm:col-span-1 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">Semua Waktu</option>
            <option value="TODAY">Hari Ini</option>
            <option value="7DAYS">7 Hari Terakhir</option>
            <option value="30DAYS">30 Hari Terakhir</option>
          </select>
        </div>
      </div>

      {/* Mutation Cards Grid */}
      {filteredMutations.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Tidak Ada Data Mutasi
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Log mutasi akan bertambah saat terjadi alur transaksi.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredMutations.map(m => {
            const item = itemMap.get(m.item_id);
            const isInbound = m.transaction_type === 'PURCHASE_INBOUND' || m.transaction_type === 'TRANSFER_RECEIVE';
            const isLoss = m.transaction_type === 'DAMAGE_LOSS' || m.transaction_type === 'MANUAL_ADJUSTMENT';

            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-3.5 py-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
              >
                {/* Direction icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isInbound
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : isLoss
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {isInbound ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[12px] text-slate-900 dark:text-white truncate">
                      {item?.name || `#${m.item_id}`}
                    </span>
                    <span className={`font-mono font-black text-[13px] tabular-nums whitespace-nowrap ${
                      isInbound
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isLoss
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {isInbound ? '+' : '-'}{m.qty} {item?.unit || 'PCS'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <TransactionBadge type={m.transaction_type} />
                      {m.reference_code && (
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {m.reference_code}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                      {formatDate(m.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
