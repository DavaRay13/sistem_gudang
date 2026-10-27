import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/Badge';
import { ShipmentTrackingModal } from '../documents/ShipmentTrackingModal';
import { SuratJalanModal } from '../documents/SuratJalanModal';
import { NavigationTab } from '../layout/Sidebar';
import { TransferRequest } from '../../types';
import { 
  Package, Boxes, Truck, Clock, 
  Store, ClipboardList, ArrowDownRight, 
  ChevronRight, FileText, ShieldAlert
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WarehouseDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({ onNavigate }) => {
  const { items, inventories, requests } = useInventory();
  const { locations, currentUser, users } = useAuth();

  const [trackingReq, setTrackingReq] = useState<TransferRequest | null>(null);
  const [suratJalanReq, setSuratJalanReq] = useState<TransferRequest | null>(null);

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

  const activeShipment = inTransitShipments[0] || readyDispatch[0] || requests[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* FlowShip Hero Banner (Clean Light with Vibrant Orange Accent) */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-50 via-white to-orange-50/40 dark:from-orange-950/30 dark:via-card dark:to-orange-950/10 border border-orange-200/80 dark:border-orange-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 sm:space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
              Selamat datang, {currentUser?.full_name || 'Admin Gudang'} 👋
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-orange-700 bg-orange-100/60 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800">
              Gudang Pusat (Hub)
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            Ship Smarter, <span className="text-orange-600 dark:text-orange-500">Deliver Faster.</span>
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Distribusi stok hub-and-spoke, otorisasi permohonan toko cabang & pelacakan ekspedisi real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-card border border-orange-200 dark:border-orange-900/50 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-2xl">
              🚚
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-600 block">Status Pengiriman</span>
              <span className="text-xs font-bold text-foreground">
                {inTransitShipments.length > 0 ? `${inTransitShipments.length} Armada Sedang Kirim` : 'Semua Terkirim'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Shipment Card */}
      {activeShipment && (
        <div
          onClick={() => setTrackingReq(activeShipment)}
          className="p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-orange-400/80 dark:hover:border-orange-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeShipment.status === 'IN_TRANSIT' ? 'bg-orange-500 animate-ping' : 'bg-emerald-500'}`} />
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                {activeShipment.status === 'IN_TRANSIT' ? 'Pengiriman Berlangsung (In-Transit)' : 'Permintaan Terkini'}
              </span>
            </div>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Lacak Posisi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold text-foreground tracking-tight font-mono">
                  {activeShipment.do_number || activeShipment.request_number}
                </span>
                <Badge className={`text-[10px] font-bold uppercase ${
                  activeShipment.status === 'IN_TRANSIT' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {activeShipment.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>Gudang Pusat</span>
                <span>➔</span>
                <span className="font-semibold text-foreground">
                  {locMap.get(activeShipment.to_location_id)?.name || 'Toko Cabang'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs">
                <span className="text-[10px] text-muted-foreground block">Estimasi Kedatangan</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {activeShipment.status === 'COMPLETED' ? 'Telah Diterima' : 'Hari Ini, 17:30'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-xl shrink-0">
                📦
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Quick Actions (Aksi Cepat) */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Aksi Cepat
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Action 1: Otorisasi */}
          <button
            onClick={() => onNavigate('warehouse_approval_queue')}
            className="p-3 sm:p-3.5 rounded-2xl bg-card border border-border hover:border-orange-500/60 text-left transition-all shadow-2xs hover:shadow-sm active:scale-[0.98] group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold block text-foreground leading-tight">
              Otorisasi ({pendingRequests.length})
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Persetujuan permohonan
            </span>
          </button>

          {/* Action 2: Dispatch & Surat Jalan */}
          <button
            onClick={() => onNavigate('warehouse_dispatch')}
            className="p-3 sm:p-3.5 rounded-2xl bg-card border border-border hover:border-blue-500/60 text-left transition-all shadow-2xs hover:shadow-sm active:scale-[0.98] group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold block text-foreground leading-tight">
              Dispatch DO ({readyDispatch.length})
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Kirim paket armada
            </span>
          </button>

          {/* Action 3: Stok Masuk */}
          <button
            onClick={() => onNavigate('warehouse_master_items')}
            className="p-3 sm:p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/60 text-left transition-all shadow-2xs hover:shadow-sm active:scale-[0.98] group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold block text-foreground leading-tight">
              Katalog & Stok
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              {items.length} master barang
            </span>
          </button>

          {/* Action 4: Riwayat Ledger */}
          <button
            onClick={() => onNavigate('warehouse_mutation_ledger')}
            className="p-3 sm:p-3.5 rounded-2xl bg-card border border-border hover:border-teal-500/60 text-left transition-all shadow-2xs hover:shadow-sm active:scale-[0.98] group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-bold block text-foreground leading-tight">
              Ledger Mutasi
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Audit trail stok
            </span>
          </button>
        </div>
      </div>

      {/* 2. Bento Grid KPI Metrics */}
      <div className="flex lg:grid lg:grid-cols-4 gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 snap-x snap-mandatory">
        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Stok Tersedia"
            value={formatNumber(totalAvailableStock)}
            subtitle={`${items.length} SKU`}
            icon={Package}
            color="emerald"
          />
        </div>

        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Disiapkan"
            value={formatNumber(totalReservedStock)}
            subtitle="Alokasi DO"
            icon={Boxes}
            color="indigo"
          />
        </div>

        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Di Jalan"
            value={formatNumber(totalInTransitStock)}
            subtitle={`${inTransitShipments.length} DO`}
            icon={Truck}
            color="blue"
          />
        </div>

        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Review"
            value={pendingRequests.length}
            subtitle={`${readyDispatch.length} siap`}
            icon={Clock}
            color="amber"
          />
        </div>
      </div>

      {/* 3. Branch Inventory Bento */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xs font-bold tracking-tight uppercase text-muted-foreground">
              Ketersediaan Stok di 3 Toko Cabang
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Data terintegrasi langsung dengan penerimaan masing-masing toko.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono uppercase bg-gradient-to-r from-emerald-50 to-emerald-100/70 text-emerald-800 border-emerald-300 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-2xs">
            Live Sinkron
          </Badge>
        </CardHeader>

        <CardContent>
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
                  className="p-3.5 rounded-lg bg-muted/40 border border-border flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">
                        {storeLoc?.name.replace(' (Cabang Barat)', '').replace(' (Cabang Selatan)', '').replace(' (Cabang Timur)', '')}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">Cabang #{storeId}</span>
                  </div>

                  <div>
                    <span className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-foreground">
                      {formatNumber(totalStock)}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-1.5">unit tersedia</span>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Status Pengiriman:</span>
                    {storeInTransit > 0 ? (
                      <Badge variant="outline" className="text-[10px] font-mono font-medium bg-gradient-to-r from-sky-50 to-blue-100/70 text-sky-800 border-sky-300 dark:from-sky-950/60 dark:to-blue-900/40 dark:text-sky-300 dark:border-sky-700/60 shadow-2xs">
                        +{storeInTransit} Unit In-Transit
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Nihil</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Two-Column Operational Bento: Pending Queue & Stock Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Recent Requests Queue */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-foreground" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Permintaan Masuk dari Toko
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('warehouse_approval_queue')}
              className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              Lihat Semua &rarr;
            </Button>
          </CardHeader>

          <CardContent className="pt-3">
            {requests.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
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
                      onClick={() => setTrackingReq(req)}
                      className="p-3 rounded-xl bg-card border border-border hover:border-orange-500/50 flex items-center justify-between text-xs transition-all cursor-pointer shadow-xs group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground group-hover:text-orange-600 transition-colors">
                            {req.request_number}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground font-medium">
                            {toLoc?.name.split(' ')[0]} Cabang {req.to_location_id}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          Total Permintaan: <strong className="font-mono text-foreground">{totalQty}</strong> Unit ({req.items.length} item)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} size="sm" />
                        <span className="text-[10px] font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          Lacak &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Low & Out-of-Stock Monitor */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Pantauan Stok Gudang ({lowStockItems.length})
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('warehouse_master_items')}
              className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              Kelola Stok &rarr;
            </Button>
          </CardHeader>

          <CardContent className="pt-3">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
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
                      className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">
                            {item.name}
                          </span>
                          {isOutOfStock ? (
                            <Badge variant="outline" className="text-[10px] font-mono font-medium bg-gradient-to-r from-rose-50 to-rose-100/70 text-rose-800 border-rose-300 dark:from-rose-950/60 dark:to-rose-900/40 dark:text-rose-300 dark:border-rose-700/60 shadow-2xs">
                              Stok Kosong
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-mono font-medium bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-800 border-amber-300 dark:from-amber-950/60 dark:to-amber-900/40 dark:text-amber-300 dark:border-amber-700/60 shadow-2xs">
                              Menipis
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                          Batas Aman: {item.safety_stock} {item.unit}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono tabular-nums text-sm font-semibold ${
                          isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {available} {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shipment Live Tracking Modal */}
      {trackingReq && (
        <ShipmentTrackingModal
          isOpen={trackingReq !== null}
          onClose={() => setTrackingReq(null)}
          request={trackingReq}
          locations={locations}
          items={items}
          isStoreStaff={false}
          onOpenSuratJalan={req => {
            setTrackingReq(null);
            setSuratJalanReq(req);
          }}
        />
      )}

      {/* Surat Jalan DO Modal */}
      {suratJalanReq && (
        <SuratJalanModal
          isOpen={suratJalanReq !== null}
          onClose={() => setSuratJalanReq(null)}
          request={suratJalanReq}
          locations={locations}
          items={items}
          users={users}
        />
      )}
    </div>
  );
};
