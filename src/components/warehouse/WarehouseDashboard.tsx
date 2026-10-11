import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/Badge';
import { NavigationTab } from '../layout/Sidebar';
import { 
  Package, Boxes, Truck, Clock, 
  Store, ClipboardList, ArrowDownRight, 
  ShieldAlert
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Minimalist Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#EAEAEA] dark:border-[#26282E]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#F7F6F3] dark:bg-[#1C1E22] text-[#787774] dark:text-[#A1A09E] border border-[#EAEAEA] dark:border-[#26282E]">
              Hub Operasional
            </span>
            <span className="text-xs text-[#787774] dark:text-[#A1A09E]">
              Gudang Pusat
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] dark:text-[#ECECED]">
            Distribusi Stok & Logistik Cabang
          </h1>
          <p className="text-xs text-[#787774] dark:text-[#A1A09E] mt-0.5">
            Ringkasan saldo stok, verifikasi permintaan toko, dan pengiriman barang terpadu.
          </p>
        </div>

        {/* Utilitarian Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('warehouse_approval_queue')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#111111] dark:bg-white text-white dark:text-[#111111] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Otorisasi ({pendingRequests.length})</span>
          </button>

          <button
            onClick={() => onNavigate('warehouse_master_items')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#EAEAEA] dark:border-[#26282E] bg-white dark:bg-[#16171A] text-[#111111] dark:text-[#ECECED] hover:bg-[#F7F6F3] dark:hover:bg-[#1C1E22] active:scale-[0.98] transition-all"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-[#346538] dark:text-[#96D99C]" />
            <span>Stok Masuk</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Grid KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Stok Tersedia"
          value={formatNumber(totalAvailableStock)}
          subtitle={`${items.length} master SKU`}
          icon={Package}
          color="emerald"
        />

        <StatCard
          title="Disiapkan Kirim"
          value={formatNumber(totalReservedStock)}
          subtitle="Teralokasi surat jalan"
          icon={Boxes}
          color="indigo"
        />

        <StatCard
          title="Dalam Pengiriman"
          value={formatNumber(totalInTransitStock)}
          subtitle={`${inTransitShipments.length} DO aktif`}
          icon={Truck}
          color="blue"
        />

        <StatCard
          title="Menunggu Review"
          value={pendingRequests.length}
          subtitle={`${readyDispatch.length} siap kirim`}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* 3. Branch Inventory Bento */}
      <div className="bg-white dark:bg-[#16171A] rounded-xl border border-[#EAEAEA] dark:border-[#26282E] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-xs font-bold tracking-tight uppercase text-[#787774] dark:text-[#A1A09E]">
              Ketersediaan Stok di 3 Toko Cabang
            </h2>
            <p className="text-[11px] text-[#A1A09E] dark:text-[#787774]">
              Data terintegrasi langsung dengan penerimaan masing-masing toko.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#EDF3EC] text-[#346538] dark:bg-[#172B19] dark:text-[#96D99C] border border-[#D4E5D3] dark:border-[#223F25]">
            Live Sinkron
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
                className="p-3.5 rounded-lg bg-[#FBFBFA] dark:bg-[#191A1E] border border-[#EAEAEA] dark:border-[#26282E] flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-[#787774] dark:text-[#A1A09E]" />
                    <span className="text-xs font-semibold text-[#111111] dark:text-[#ECECED]">
                      {storeLoc?.name.replace(' (Cabang Barat)', '').replace(' (Cabang Selatan)', '').replace(' (Cabang Timur)', '')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#787774]">Cabang #{storeId}</span>
                </div>

                <div>
                  <span className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-[#111111] dark:text-[#ECECED]">
                    {formatNumber(totalStock)}
                  </span>
                  <span className="text-[11px] text-[#787774] dark:text-[#A1A09E] ml-1.5">unit tersedia</span>
                </div>

                <div className="pt-2 border-t border-[#EAEAEA] dark:border-[#26282E] flex items-center justify-between text-[11px]">
                  <span className="text-[#787774] dark:text-[#A1A09E]">Status Pengiriman:</span>
                  {storeInTransit > 0 ? (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-medium bg-[#E1F3FE] text-[#1F6C9F] dark:bg-[#142838] dark:text-[#97D2FB] border border-[#C8E7FD] dark:border-[#1E3B52]">
                      +{storeInTransit} Unit In-Transit
                    </span>
                  ) : (
                    <span className="text-[#A1A09E] dark:text-[#787774]">Nihil</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Two-Column Operational Bento: Pending Queue & Stock Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Recent Requests Queue */}
        <div className="bg-white dark:bg-[#16171A] rounded-xl border border-[#EAEAEA] dark:border-[#26282E] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EAEAEA] dark:border-[#26282E]">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#111111] dark:text-[#ECECED]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-[#ECECED]">
                  Permintaan Masuk dari Toko
                </h3>
              </div>
              <button
                onClick={() => onNavigate('warehouse_approval_queue')}
                className="text-[11px] font-medium text-[#787774] hover:text-[#111111] dark:hover:text-white"
              >
                Lihat Semua &rarr;
              </button>
            </div>

            {requests.length === 0 ? (
              <p className="text-xs text-[#787774] text-center py-6">
                Belum ada permohonan stok dari toko cabang.
              </p>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 4).map(req => {
                  const toLoc = locMap.get(req.to_location_id);
                  const totalQty = req.items.reduce((s, i) => s + i.qty_requested, 0);

                  return (
                    <div
                      key={req.id}
                      className="p-3 rounded-lg bg-[#FBFBFA] dark:bg-[#191A1E] border border-[#EAEAEA] dark:border-[#26282E] hover:border-[#D4D4D4] dark:hover:border-[#383A42] flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#111111] dark:text-[#ECECED]">
                            {req.request_number}
                          </span>
                          <span className="text-[#A1A09E] dark:text-[#787774]">•</span>
                          <span className="text-[#787774] dark:text-[#A1A09E]">
                            {toLoc?.name.split(' ')[0]} Cabang {req.to_location_id}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#787774] dark:text-[#A1A09E] mt-0.5 block">
                          Total Permintaan: <strong className="font-mono text-[#111111] dark:text-[#ECECED]">{totalQty}</strong> Unit ({req.items.length} item)
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

        {/* Right Column: Low & Out-of-Stock Monitor */}
        <div className="bg-white dark:bg-[#16171A] rounded-xl border border-[#EAEAEA] dark:border-[#26282E] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EAEAEA] dark:border-[#26282E]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#956400] dark:text-[#E8CA65]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] dark:text-[#ECECED]">
                  Pantauan Stok Gudang ({lowStockItems.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('warehouse_master_items')}
                className="text-[11px] font-medium text-[#787774] hover:text-[#111111] dark:hover:text-white"
              >
                Kelola Stok &rarr;
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-[#787774] text-center py-6">
                Semua stok barang gudang berada dalam batas aman.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.slice(0, 4).map(item => {
                  const inv = hubInventories.find(i => i.item_id === item.id);
                  const available = inv ? inv.stock_available : 0;
                  const isOutOfStock = available <= 0;

                  return (
                    <div 
                      key={item.id} 
                      className="p-3 rounded-lg bg-[#FBFBFA] dark:bg-[#191A1E] border border-[#EAEAEA] dark:border-[#26282E] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#111111] dark:text-[#ECECED] truncate">
                            {item.name}
                          </span>
                          {isOutOfStock ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[#381B1B] dark:text-[#F8A4A4] border border-[#F8D2D4] dark:border-[#522525]">
                              Stok Kosong
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-[#FBF3DB] text-[#956400] dark:bg-[#332A15] dark:text-[#E8CA65] border border-[#F4E3B4] dark:border-[#4D3F1E]">
                              Menipis
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[#787774] dark:text-[#A1A09E] block mt-0.5">
                          {item.sku} • Batas Aman: {item.safety_stock} {item.unit}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono tabular-nums text-sm font-semibold ${
                          isOutOfStock ? 'text-[#9F2F2D] dark:text-[#F8A4A4]' : 'text-[#956400] dark:text-[#E8CA65]'
                        }`}>
                          {available} {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
