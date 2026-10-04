import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/Badge';
import { NavigationTab } from '../layout/Sidebar';
import { 
  Warehouse, Package, Clock, Truck, 
  ShieldAlert, ArrowDownRight, ClipboardList, 
  Store, Boxes
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface WarehouseDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({ onNavigate }) => {
  const { items, inventories, requests } = useInventory();
  const { locations } = useAuth();

  const locMap = new Map(locations.map(l => [l.id, l]));

  // Gudang Pusat (Location 0) Totals
  const hubInventories = inventories.filter(inv => inv.location_id === 0);
  const totalAvailableStock = hubInventories.reduce((sum, inv) => sum + inv.stock_available, 0);
  const totalReservedStock = hubInventories.reduce((sum, inv) => sum + inv.stock_reserved, 0);
  const totalInTransitStock = hubInventories.reduce((sum, inv) => sum + inv.stock_in_transit, 0);

  // Requests Counts
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const readyDispatch = requests.filter(r => r.status === 'APPROVED' || r.status === 'PARTIAL');
  const inTransitShipments = requests.filter(r => r.status === 'IN_TRANSIT');

  // Low stock items in Central Warehouse
  const lowStockItems = items.filter(item => {
    const inv = hubInventories.find(i => i.item_id === item.id);
    const available = inv ? inv.stock_available : 0;
    return available <= item.safety_stock;
  });

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* MOBILE-ONLY REDESIGNED VIEW (Matches Mobile Screen Mockup) */}
      {/* ========================================================= */}
      <div className="sm:hidden space-y-4">
        {/* Mobile Hub Status Card */}
        <div className="p-5 rounded-3xl bg-[#0c1220] border border-slate-800 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">Hub Distribusi Pusat</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Logistik Multi-Cabang • Live Status
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]" />
          </div>

          {/* 3 Balanced Metrics */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80">
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">Stok Bebas</span>
              <span className="block text-xl font-black font-mono tracking-tight text-white mt-0.5">
                {formatNumber(totalAvailableStock)}
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold block">Siap Alokasi</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">Reservasi</span>
              <span className="block text-xl font-black font-mono tracking-tight text-indigo-400 mt-0.5">
                {formatNumber(totalReservedStock)}
              </span>
              <span className="text-[9px] text-slate-500 block">Siap Antar</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-medium">In-Transit</span>
              <span className="block text-xl font-black font-mono tracking-tight text-cyan-400 mt-0.5">
                {formatNumber(totalInTransitStock)}
              </span>
              <span className="text-[9px] text-cyan-500 block">Di Perjalanan</span>
            </div>
          </div>

          {/* In-Transit Alert Strip */}
          {inTransitShipments.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('warehouse_dispatch')}
              className="w-full mt-3.5 p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between active:scale-98 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Armada Pengiriman Aktif</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {inTransitShipments.length} DO menuju toko cabang
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/40">
                Pantau
              </span>
            </button>
          )}
        </div>

        {/* Quick Action Buttons (Prominent Tactile Buttons) */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            Aksi Utama Gudang
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('warehouse_approval_queue')}
              className="py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 group relative"
            >
              <ClipboardList className="w-4 h-4 text-indigo-100 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Persetujuan</span>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white ring-2 ring-slate-900 shadow-sm">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('warehouse_dispatch')}
              className="py-3.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm group"
            >
              <Truck className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Kirim DO</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP VIEW (Visible on sm: screens and wider)            */}
      {/* ========================================================= */}
      <div className="hidden sm:block p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-brand-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold uppercase tracking-wider border border-brand-400/30">
              <Warehouse className="w-3 h-3" />
              <span>Gudang Pusat</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
              Distribusi Stok Antar Toko
            </h1>
            
            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Sistem distribusi stok dan konfirmasi serah terima barang terpadu ke 3 toko cabang.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-1 lg:pt-0 shrink-0">
            <button
              onClick={() => onNavigate('warehouse_approval_queue')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm active:scale-95 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Persetujuan ({pendingRequests.length})</span>
            </button>

            <button
              onClick={() => onNavigate('warehouse_master_items')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 transition-all"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              <span>Tambah Stok Masuk</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (2 cols mobile, 4 cols desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Stok Tersedia"
          value={formatNumber(totalAvailableStock)}
          subtitle={`${items.length} jenis barang`}
          icon={Package}
          color="emerald"
        />

        <StatCard
          title="Disiapkan Kirim"
          value={formatNumber(totalReservedStock)}
          subtitle="Menunggu diantar"
          icon={Boxes}
          color="indigo"
        />

        <StatCard
          title="Sedang Dikirim"
          value={formatNumber(totalInTransitStock)}
          subtitle={`${inTransitShipments.length} pengiriman aktif`}
          icon={Truck}
          color="blue"
        />

        <StatCard
          title="Permintaan Masuk"
          value={pendingRequests.length}
          subtitle={`${readyDispatch.length} siap dikirim`}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Store Distribution Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-brand-600" />
            <span>Ketersediaan Stok di 3 Toko Cabang</span>
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Realtime
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(storeId => {
            const storeLoc = locMap.get(storeId);
            const storeInvs = inventories.filter(inv => inv.location_id === storeId);
            const totalStock = storeInvs.reduce((sum, inv) => sum + inv.stock_available, 0);
            const storeInTransit = requests
              .filter(r => r.to_location_id === storeId && r.status === 'IN_TRANSIT')
              .reduce((sum, r) => sum + r.items.reduce((iSum, i) => iSum + i.qty_dispatched, 0), 0);

            return (
              <div
                key={storeId}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between sm:flex-col sm:text-center gap-2"
              >
                <div className="text-left sm:text-center">
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {storeLoc?.name.split(' ')[0]} Cabang {storeId}
                  </span>
                  <span className="block text-lg sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {formatNumber(totalStock)}
                  </span>
                </div>
                {storeInTransit > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    +{storeInTransit} di perjalanan
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Tidak ada kiriman
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Operations Grid (Alerts & Recent Transfers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Safety Stock Alert Section */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Stok Gudang Menipis ({lowStockItems.length} Barang)</span>
            </div>
            <button
              onClick={() => onNavigate('warehouse_master_items')}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Tambah Stok &rarr;
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
              Semua stok barang masih aman di atas batas minimum.
            </p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 4).map(item => {
                const inv = hubInventories.find(i => i.item_id === item.id);
                const available = inv ? inv.stock_available : 0;
                return (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/50 dark:border-amber-900/30">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{item.name}</span>
                    <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400">
                      {available} / {item.safety_stock} {item.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transfer Requests */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-600" />
              <span>Permintaan Barang Masuk Terkini</span>
            </h3>
            <button
              onClick={() => onNavigate('warehouse_approval_queue')}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          {requests.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Belum ada permintaan barang dari toko cabang.
            </p>
          ) : (
            <div className="space-y-2">
              {requests.slice(0, 4).map(req => {
                const toLoc = locMap.get(req.to_location_id);
                const totalQty = req.items.reduce((s, i) => s + i.qty_requested, 0);

                return (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold font-mono text-slate-900 dark:text-white block">
                        {req.request_number}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {toLoc?.name} • {totalQty} Unit
                      </span>
                    </div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
