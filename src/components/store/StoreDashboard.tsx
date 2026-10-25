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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
      <div className="space-y-4 pb-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-gradient-to-r from-emerald-50 to-emerald-100/70 text-emerald-800 border-emerald-300 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-2xs">
                Toko
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {currentLocation?.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Kelola Barang Toko
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Minta pasokan barang ke gudang pusat dan terima kiriman paket yang tiba.
            </p>
          </div>
        </div>

        {/* Quick Actions (Mobile: 1 Hero Full-width + 2-Col Status Grid; Desktop: 3-Col Bento) */}
        <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
          {/* Tombol 1: Minta Barang */}
          <button
            onClick={() => handleOpenRequestForItem()}
            className="w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-foreground text-background flex items-center justify-between shadow-sm active:scale-[0.98] transition-all text-left group"
          >
            <div className="flex items-center gap-2.5 sm:block sm:space-y-0.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-background/10 flex items-center justify-center shrink-0 sm:hidden">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:block">
                  Permintaan Baru
                </span>
                <span className="text-xs sm:text-sm font-bold block leading-tight">
                  + Minta Pasokan Barang
                </span>
                <span className="text-[10px] sm:text-[11px] opacity-80 block">
                  Pilih barang dari gudang pusat
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-background/10 items-center justify-center shrink-0 hidden sm:flex">
              <PlusCircle className="w-5 h-5" />
            </div>
          </button>

          {/* Grid 2-Kolom untuk 2 Status Action di Mobile */}
          <div className="grid grid-cols-2 gap-2 sm:contents">
            {/* Tombol 2: Kiriman Masuk */}
            <button
              onClick={() => {
                if (inTransitRequests.length > 0) {
                  setActiveReceivingReq(inTransitRequests[0]);
                } else {
                  onNavigate('store_receiving');
                }
              }}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left flex items-center justify-between active:scale-[0.98] transition-all ${
                inTransitRequests.length > 0
                  ? 'bg-gradient-to-br from-sky-50 to-blue-100/70 dark:from-sky-950/60 dark:to-blue-900/40 border-sky-300 dark:border-sky-700/60 text-sky-900 dark:text-sky-200 shadow-2xs'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80 block truncate">
                  Kiriman Kurir
                </span>
                <span className="text-xs sm:text-sm font-bold block truncate leading-tight">
                  {inTransitRequests.length > 0 ? `${inTransitRequests.length} Di Jalan` : 'Nihil'}
                </span>
                <span className="text-[10px] opacity-75 hidden sm:block">
                  {inTransitRequests.length > 0 ? 'Klik untuk terima' : 'Semua sampai'}
                </span>
              </div>
              <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                inTransitRequests.length > 0 ? 'bg-sky-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                <Truck className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
            </button>

            {/* Tombol 3: Stok Perlu Tambah */}
            <button
              onClick={() => setStockFilter(stockFilter === 'LOW' ? 'ALL' : 'LOW')}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left flex items-center justify-between active:scale-[0.98] transition-all ${
                lowStockItems.length + outOfStockItems.length > 0
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100/70 dark:from-amber-950/60 dark:to-amber-900/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 shadow-2xs'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80 block truncate">
                  Peringatan Stok
                </span>
                <span className="text-xs sm:text-sm font-bold block truncate leading-tight">
                  {lowStockItems.length + outOfStockItems.length} Perlu Tambah
                </span>
                <span className="text-[10px] opacity-75 hidden sm:block">
                  {stockFilter === 'LOW' ? 'Filter krisis' : 'Lihat daftar'}
                </span>
              </div>
              <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                lowStockItems.length + outOfStockItems.length > 0 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                <AlertCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Alert barang dalam perjalanan */}
      {inTransitRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-blue-100/70 dark:from-sky-950/60 dark:to-blue-900/40 border border-sky-300 dark:border-sky-700/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-card border border-sky-300 dark:border-sky-700/60 text-sky-700 dark:text-sky-300 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sky-900 dark:text-sky-200 block">
                {inTransitRequests.length} Kiriman Barang Sedang Dalam Perjalanan ke Toko Anda
              </span>
              <span className="text-[11px] text-sky-700 dark:text-sky-300 font-mono mt-0.5 block">
                DO: {inTransitRequests.map(r => r.do_number || r.request_number).join(', ')}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveReceivingReq(inTransitRequests[0])}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98] transition-all shrink-0 shadow-2xs"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Hitung & Konfirmasi Barang Datang</span>
          </button>
        </div>
      )}

      {/* 3. KPI ringkasan: Carousel geser di mobile, Grid di desktop */}
      <div className="flex lg:grid lg:grid-cols-4 gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 snap-x snap-mandatory">
        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Stok di Toko"
            value={formatNumber(totalLocalStock)}
            subtitle={`${myInventories.length} jenis`}
            icon={Package}
            color="emerald"
          />
        </div>
        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Hampir Habis"
            value={lowStockItems.length}
            subtitle="Perlu diminta"
            icon={ShieldAlert}
            color="amber"
          />
        </div>
        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Sedang Dikirim"
            value={inTransitRequests.length}
            subtitle="Truk jalan"
            icon={Truck}
            color="blue"
          />
        </div>
        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Menunggu"
            value={pendingRequests.length}
            subtitle="Diproses"
            icon={Clock}
            color="purple"
          />
        </div>
      </div>

      {/* 4. Tracker status permintaan terkini */}
      {storeRequests.length > 0 && (
        <Card className="shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold tracking-tight uppercase text-muted-foreground">
                Status Permintaan Terkini
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Lacak perjalanan barang yang kamu minta dari gudang.
              </p>
            </div>
            <button
              onClick={() => onNavigate('store_request_history')}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
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
                <div key={req.id} className="p-3 rounded-lg bg-muted/40 border border-border">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-foreground">{req.request_number}</span>
                      <span className="text-[10px] text-muted-foreground">· {totalQty} unit · {req.items.length} barang</span>
                    </div>
                    {isRejected && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-rose-50 to-rose-100/70 text-rose-800 border-rose-300 dark:from-rose-950/60 dark:to-rose-900/40 dark:text-rose-300 dark:border-rose-700/60 shadow-2xs">
                        <AlertCircle className="w-2.5 h-2.5" /> Ditolak
                      </span>
                    )}
                    {isInTransit && (
                      <button
                        onClick={() => setActiveReceivingReq(req)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-sky-600 text-white hover:bg-sky-700 active:scale-95 transition-all shadow-2xs"
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span>Konfirmasi</span>
                      </button>
                    )}
                  </div>

                  {isRejected ? (
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      {req.rejection_notes || 'Permintaan ditolak oleh admin gudang.'}
                    </p>
                  ) : (
                    <div className="flex items-center gap-0">
                      {steps.map((step, idx) => (
                        <React.Fragment key={step.label}>
                          <div className="flex flex-col items-center text-center" style={{ minWidth: 60 }}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
                              step.done
                                ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
                                : 'bg-card border-border text-muted-foreground'
                            }`}>
                              {step.done ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[9px] mt-1 leading-tight ${step.done ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
                              {step.label}
                            </span>
                          </div>
                          {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-3 transition-colors ${steps[idx + 1].done ? 'bg-emerald-500' : 'bg-border'}`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 5. Daftar stok toko */}
      <Card className="shadow-xs space-y-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <CardTitle className="text-xs font-bold tracking-tight uppercase text-muted-foreground">
              Katalog Stok Barang Toko ({filteredItems.length} barang)
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Pantau sisa barang dan minta tambahan pasokan dengan 1 klik.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Cari nama barang atau kategori..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">

        {/* Filter Chips Ramah Pengguna Awam */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStockFilter('ALL')}
            className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 ${
              stockFilter === 'ALL'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setStockFilter('LOW')}
            className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              stockFilter === 'LOW'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-800 border border-amber-300 dark:from-amber-950/60 dark:to-amber-900/40 dark:text-amber-300 dark:border-amber-700/60'
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
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'bg-gradient-to-r from-rose-50 to-rose-100/70 text-rose-800 border border-rose-300 dark:from-rose-950/60 dark:to-rose-900/40 dark:text-rose-300 dark:border-rose-700/60'
            }`}
          >
            <span>❌ Stok Habis</span>
            <span className="font-mono text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/20">
              {outOfStockItems.length}
            </span>
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-10 px-4 bg-card rounded-xl border border-dashed border-border">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-foreground">
              Tidak ada barang yang cocok
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Coba kata kunci lain atau ubah filter status di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            {filteredItems.map(item => {
              const inv = myInventories.find(i => i.item_id === item.id);
              const available = inv ? inv.stock_available : 0;
              const isOutOfStock = available <= 0;
              const isLow = !isOutOfStock && available <= item.safety_stock;

              return (
                <div
                  key={item.id}
                  className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-foreground/20 flex items-center justify-between gap-2.5 text-xs transition-colors shadow-2xs"
                >
                  <div className="min-w-0 flex-1 flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      isOutOfStock
                        ? 'bg-rose-500 animate-pulse'
                        : isLow
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`} />
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-foreground block truncate">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground font-mono flex-wrap">
                        <span className="font-semibold text-foreground/80">
                          {item.category || 'Barang'}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(item.price || 0)}
                        </span>
                        <span>/{item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className={`font-mono tabular-nums text-xs sm:text-sm font-bold block ${
                        isOutOfStock 
                          ? 'text-rose-600 dark:text-rose-400' 
                          : 'text-foreground'
                      }`}>
                        {formatNumber(available)} {item.unit}
                      </span>

                      {isOutOfStock ? (
                        <Badge variant="outline" className="text-[9px] font-bold bg-gradient-to-r from-rose-50 to-rose-100/70 text-rose-800 border-rose-300 dark:from-rose-950/60 dark:to-rose-900/40 dark:text-rose-300 dark:border-rose-700/60 shadow-2xs">
                          Habis
                        </Badge>
                      ) : isLow ? (
                        <Badge variant="outline" className="text-[9px] font-bold bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-800 border-amber-300 dark:from-amber-950/60 dark:to-amber-900/40 dark:text-amber-300 dark:border-amber-700/60 shadow-2xs">
                          Menipis
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-semibold bg-gradient-to-r from-emerald-50 to-emerald-100/70 text-emerald-800 border-emerald-300 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-2xs">
                          Aman
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRequestForItem(item.id)}
                      className="h-8 px-2.5 text-xs font-semibold gap-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      title="Minta pasokan barang ini"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Minta</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </CardContent>
      </Card>

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
