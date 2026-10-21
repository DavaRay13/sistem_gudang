import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import { CreateRequestModal } from './CreateRequestModal';
import { ReceivingHandshakeModal } from './ReceivingHandshakeModal';
import { NavigationTab } from '../layout/Sidebar';
import { TransferRequest } from '../../types';
import { 
  Package, Truck, Clock, 
  ShieldAlert, PlusCircle, CheckSquare, 
  Search, ChevronRight, AlertCircle
} from 'lucide-react';
import { formatNumber, formatRupiah } from '../../utils/formatters';

interface StoreDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const StoreDashboard: React.FC<StoreDashboardProps> = ({ onNavigate }) => {
  const { items, inventories, requests } = useInventory();
  const { currentLocation } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItemIdForRequest, setSelectedItemIdForRequest] = useState<number | undefined>(undefined);
  const [activeReceivingReq, setActiveReceivingReq] = useState<TransferRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  const myLocationId = currentLocation?.id;

  // Local inventory for this store
  const myInventories = inventories.filter(inv => inv.location_id === myLocationId);
  const totalLocalStock = myInventories.reduce((sum, inv) => sum + inv.stock_available, 0);

  // Requests for this store
  const storeRequests = requests.filter(r => r.to_location_id === myLocationId);
  const inTransitRequests = storeRequests.filter(r => r.status === 'IN_TRANSIT');
  const pendingRequests = storeRequests.filter(r => r.status === 'PENDING');

  // Active items (excluding archived)
  const activeItems = items.filter(item => !item.is_archived);

  // Low & out stock items in this store
  const lowStockItems = activeItems.filter(item => {
    const inv = myInventories.find(i => i.item_id === item.id);
    const available = inv ? inv.stock_available : 0;
    return available > 0 && available <= item.safety_stock;
  });

  const outOfStockItems = activeItems.filter(item => {
    const inv = myInventories.find(i => i.item_id === item.id);
    const available = inv ? inv.stock_available : 0;
    return available <= 0;
  });

  const filteredItems = activeItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const inv = myInventories.find(i => i.item_id === item.id);
    const available = inv ? inv.stock_available : 0;

    if (stockFilter === 'LOW') return available > 0 && available <= item.safety_stock;
    if (stockFilter === 'OUT') return available <= 0;
    return true;
  });

  const handleOpenRequestForItem = (itemId?: number) => {
    setSelectedItemIdForRequest(itemId);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header & Quick Actions */}
      <div className="space-y-4 pb-4 border-b border-[#EAEAEA] dark:border-[#26282E]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#EDF3EC] text-[#346538] dark:bg-[#172B19] dark:text-[#96D99C] border border-[#D4E5D3] dark:border-[#223F25]">
                Toko
              </span>
              <span className="text-xs font-medium text-[#787774] dark:text-[#A1A09E]">
                {currentLocation?.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] dark:text-[#ECECED]">
              Kelola Barang Toko
            </h1>
            <p className="text-xs text-[#787774] dark:text-[#A1A09E] mt-0.5">
              Minta pasokan barang ke gudang pusat dan terima kiriman paket yang tiba.
            </p>
          </div>
        </div>

        {/* 3 Tombol Aksi Cepat Ramah Sentuhan (Mobile-First) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tombol 1: Minta Barang */}
          <button
            onClick={() => handleOpenRequestForItem()}
            className="p-3.5 rounded-2xl bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-between shadow-sm active:scale-[0.98] transition-all text-left group"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600 block">
                Permintaan Baru
              </span>
              <span className="text-sm font-bold block">
                + Minta Barang
              </span>
              <span className="text-[11px] text-slate-300 dark:text-slate-500 block">
                Pilih barang dari gudang pusat
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/5 flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
          </button>

          {/* Tombol 2: Kiriman Masuk */}
          <button
            onClick={() => {
              if (inTransitRequests.length > 0) {
                setActiveReceivingReq(inTransitRequests[0]);
              } else {
                onNavigate('store_receiving');
              }
            }}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between active:scale-[0.98] transition-all ${
              inTransitRequests.length > 0
                ? 'bg-[#E1F3FE] dark:bg-[#142838] border-[#C8E7FD] dark:border-[#1E3B52] text-[#1F6C9F] dark:text-[#97D2FB]'
                : 'bg-white dark:bg-[#16171A] border-[#EAEAEA] dark:border-[#26282E] text-[#787774] dark:text-[#A1A09E]'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
                Kiriman Kurir
              </span>
              <span className="text-sm font-bold block">
                {inTransitRequests.length > 0 ? `${inTransitRequests.length} Kiriman Di Jalan` : 'Tidak Ada Kiriman'}
              </span>
              <span className="text-[11px] opacity-80 block">
                {inTransitRequests.length > 0 ? 'Klik untuk terima saat tiba' : 'Semua kiriman sudah sampai'}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              inTransitRequests.length > 0 ? 'bg-[#1F6C9F] text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <Truck className="w-5 h-5" />
            </div>
          </button>

          {/* Tombol 3: Stok Perlu Tambah */}
          <button
            onClick={() => setStockFilter(stockFilter === 'LOW' ? 'ALL' : 'LOW')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between active:scale-[0.98] transition-all ${
              lowStockItems.length + outOfStockItems.length > 0
                ? 'bg-[#FBF3DB] dark:bg-[#332A15] border-[#F4E3B4] dark:border-[#4D3F1E] text-[#956400] dark:text-[#E8CA65]'
                : 'bg-white dark:bg-[#16171A] border-[#EAEAEA] dark:border-[#26282E] text-[#787774] dark:text-[#A1A09E]'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
                Peringatan Stok
              </span>
              <span className="text-sm font-bold block">
                {lowStockItems.length + outOfStockItems.length} Barang Perlu Tambah
              </span>
              <span className="text-[11px] opacity-80 block">
                {stockFilter === 'LOW' ? 'Menampilkan filter krisis' : 'Klik untuk lihat daftar'}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              lowStockItems.length + outOfStockItems.length > 0 ? 'bg-[#956400] text-white dark:bg-[#E8CA65] dark:text-black' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>

      {/* 2. Alert barang dalam perjalanan */}
      {inTransitRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-[#E1F3FE] dark:bg-[#142838] border border-[#C8E7FD] dark:border-[#1E3B52] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-[#1B3245] border border-[#C8E7FD] dark:border-[#24425A] text-[#1F6C9F] dark:text-[#97D2FB] shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-[#1F6C9F] dark:text-[#97D2FB] block">
                {inTransitRequests.length} Kiriman Barang Sedang Dalam Perjalanan ke Toko Anda
              </span>
              <span className="text-[11px] text-[#2F6B94] dark:text-[#88C4EE] font-mono mt-0.5 block">
                DO: {inTransitRequests.map(r => r.do_number || r.request_number).join(', ')}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveReceivingReq(inTransitRequests[0])}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1F6C9F] text-white hover:bg-[#185984] active:scale-[0.98] transition-all shrink-0"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Hitung & Konfirmasi Barang Datang</span>
          </button>
        </div>
      )}

      {/* 3. KPI ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Stok di Toko"
          value={formatNumber(totalLocalStock)}
          subtitle={`${myInventories.length} jenis barang`}
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="Stok Hampir Habis"
          value={lowStockItems.length}
          subtitle="Perlu segera diminta"
          icon={ShieldAlert}
          color="amber"
        />
        <StatCard
          title="Sedang Dikirim"
          value={inTransitRequests.length}
          subtitle="Truk dalam perjalanan"
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Menunggu Gudang"
          value={pendingRequests.length}
          subtitle="Diproses admin gudang"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* 4. Tracker status permintaan terkini */}
      {storeRequests.length > 0 && (
        <div className="bg-white dark:bg-[#16171A] rounded-xl border border-[#EAEAEA] dark:border-[#26282E] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold tracking-tight uppercase text-[#787774] dark:text-[#A1A09E]">
                Status Permintaan Terkini
              </h2>
              <p className="text-[11px] text-[#A1A09E] dark:text-[#787774]">
                Lacak perjalanan barang yang kamu minta dari gudang.
              </p>
            </div>
            <button
              onClick={() => onNavigate('store_request_history')}
              className="flex items-center gap-1 text-[11px] font-medium text-[#787774] hover:text-[#111111] dark:hover:text-white transition-colors"
            >
              <span>Lihat semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {storeRequests.slice(0, 5).map(req => {
              // Stepper: 4 langkah
              const steps = [
                { label: 'Diajukan', done: true },
                { label: 'Disetujui Gudang', done: ['APPROVED', 'PARTIAL', 'IN_TRANSIT', 'COMPLETED', 'DISCREPANCY'].includes(req.status) },
                { label: 'Dikirim Truk', done: ['IN_TRANSIT', 'COMPLETED', 'DISCREPANCY'].includes(req.status) },
                { label: 'Diterima Toko', done: ['COMPLETED', 'DISCREPANCY'].includes(req.status) },
              ];
              const isRejected = req.status === 'REJECTED';
              const isInTransit = req.status === 'IN_TRANSIT';
              const totalQty = req.items.reduce((s, i) => s + i.qty_requested, 0);

              return (
                <div key={req.id} className="p-3 rounded-lg bg-[#FBFBFA] dark:bg-[#191A1E] border border-[#EAEAEA] dark:border-[#26282E]">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[#111111] dark:text-[#ECECED]">{req.request_number}</span>
                      <span className="text-[10px] text-[#A1A09E]">· {totalQty} unit · {req.items.length} barang</span>
                    </div>
                    {isRejected && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[#381B1B] dark:text-[#F8A4A4] border border-[#F8D2D4] dark:border-[#522525]">
                        <AlertCircle className="w-2.5 h-2.5" /> Ditolak
                      </span>
                    )}
                    {isInTransit && (
                      <button
                        onClick={() => setActiveReceivingReq(req)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-[#1F6C9F] text-white hover:bg-[#185984] active:scale-95 transition-all"
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span>Konfirmasi</span>
                      </button>
                    )}
                  </div>

                  {isRejected ? (
                    <p className="text-[11px] text-[#9F2F2D] dark:text-[#F8A4A4]">
                      {req.rejection_notes || 'Permintaan ditolak oleh admin gudang.'}
                    </p>
                  ) : (
                    <div className="flex items-center gap-0">
                      {steps.map((step, idx) => (
                        <React.Fragment key={step.label}>
                          <div className="flex flex-col items-center text-center" style={{ minWidth: 60 }}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
                              step.done
                                ? 'bg-[#346538] border-[#346538] text-white dark:bg-[#96D99C] dark:border-[#96D99C] dark:text-[#111111]'
                                : 'bg-white dark:bg-[#16171A] border-[#D4D4D4] dark:border-[#383A42] text-[#A1A09E]'
                            }`}>
                              {step.done ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[9px] mt-1 leading-tight ${step.done ? 'text-[#346538] dark:text-[#96D99C] font-medium' : 'text-[#A1A09E] dark:text-[#787774]'}`}>
                              {step.label}
                            </span>
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-3 transition-colors ${steps[idx + 1].done ? 'bg-[#346538] dark:bg-[#96D99C]' : 'bg-[#EAEAEA] dark:bg-[#26282E]'}`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Daftar stok toko */}
      <div className="bg-white dark:bg-[#16171A] rounded-2xl border border-[#EAEAEA] dark:border-[#26282E] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAEAEA] dark:border-[#26282E]">
          <div>
            <h2 className="text-xs font-bold tracking-tight uppercase text-[#787774] dark:text-[#A1A09E]">
              Katalog Stok Barang Toko ({filteredItems.length} barang)
            </h2>
            <p className="text-[11px] text-[#A1A09E] dark:text-[#787774]">
              Pantau sisa barang dan minta tambahan pasokan dengan 1 klik.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#787774] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama barang atau kategori..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#FBFBFA] dark:bg-[#191A1E] border border-[#EAEAEA] dark:border-[#26282E] text-[#111111] dark:text-[#ECECED] placeholder-[#A1A09E] focus:outline-none focus:border-[#111111] dark:focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* Filter Chips Ramah Pengguna Awam */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStockFilter('ALL')}
            className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 ${
              stockFilter === 'ALL'
                ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                : 'bg-[#F4F4F3] text-[#787774] dark:bg-[#202227] dark:text-[#A1A09E]'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setStockFilter('LOW')}
            className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              stockFilter === 'LOW'
                ? 'bg-[#956400] text-white dark:bg-[#E8CA65] dark:text-black font-semibold'
                : 'bg-[#FBF3DB] text-[#956400] dark:bg-[#332A15] dark:text-[#E8CA65]'
            }`}
          >
            <span>⚠️ Sisa Sedikit</span>
            <span className="font-mono text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/20">
              {lowStockItems.length}
            </span>
          </button>
          <button
            onClick={() => setStockFilter('OUT')}
            className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              stockFilter === 'OUT'
                ? 'bg-[#9F2F2D] text-white dark:bg-[#F8A4A4] dark:text-black font-semibold'
                : 'bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[#381B1B] dark:text-[#F8A4A4]'
            }`}
          >
            <span>❌ Stok Habis</span>
            <span className="font-mono text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/20">
              {outOfStockItems.length}
            </span>
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[#FBFBFA] dark:bg-[#191A1E] rounded-xl border border-dashed border-[#EAEAEA] dark:border-[#26282E]">
            <Package className="w-8 h-8 text-[#A1A09E] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[#111111] dark:text-[#ECECED]">
              Tidak ada barang yang cocok
            </p>
            <p className="text-[11px] text-[#787774] dark:text-[#A1A09E] mt-0.5">
              Coba kata kunci lain atau ubah filter status di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map(item => {
              const inv = myInventories.find(i => i.item_id === item.id);
              const available = inv ? inv.stock_available : 0;
              const isOutOfStock = available <= 0;
              const isLow = !isOutOfStock && available <= item.safety_stock;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#FBFBFA] dark:bg-[#191A1E] border border-[#EAEAEA] dark:border-[#26282E] hover:border-[#D4D4D4] dark:hover:border-[#383A42] flex items-center justify-between gap-3 text-xs transition-colors shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm text-[#111111] dark:text-[#ECECED] block truncate">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#787774] dark:text-[#A1A09E] flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px] font-medium">
                        {item.category || 'Barang'}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(item.price || 0)}
                      </span>
                      <span>/ {item.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className={`font-mono tabular-nums text-sm font-bold block ${
                        isOutOfStock 
                          ? 'text-[#9F2F2D] dark:text-[#F8A4A4]' 
                          : 'text-[#111111] dark:text-[#ECECED]'
                      }`}>
                        {formatNumber(available)} {item.unit}
                      </span>

                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[#381B1B] dark:text-[#F8A4A4] border border-[#F8D2D4] dark:border-[#522525]">
                          Habis
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FBF3DB] text-[#956400] dark:bg-[#332A15] dark:text-[#E8CA65] border border-[#F4E3B4] dark:border-[#4D3F1E]">
                          Sisa Sedikit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EDF3EC] text-[#346538] dark:bg-[#172B19] dark:text-[#96D99C] border border-[#D4E5D3] dark:border-[#223F25]">
                          Stok Aman
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenRequestForItem(item.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16171A] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-95 font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                      title="Minta pasokan barang ini"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Minta</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        initialItemId={selectedItemIdForRequest}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedItemIdForRequest(undefined);
        }}
      />

      {/* Receiving Handshake Modal */}
      {activeReceivingReq && (
        <ReceivingHandshakeModal
          isOpen={activeReceivingReq !== null}
          onClose={() => setActiveReceivingReq(null)}
          request={activeReceivingReq}
          items={items}
        />
      )}
    </div>
  );
};
