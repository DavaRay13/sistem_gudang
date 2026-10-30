import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/Badge';
import { ShipmentTrackingModal } from '../documents/ShipmentTrackingModal';
import { SuratJalanModal } from '../documents/SuratJalanModal';
import { WorkflowStatusLooper } from '../common/WorkflowStatusLooper';
import { NavigationTab } from '../layout/Sidebar';
import { TransferRequest } from '../../types';
import { 
  Package, Boxes, Truck, Clock, 
  Store, ClipboardList, 
  FileText, PlusCircle
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
  const { locations, users } = useAuth();

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

  // Low stock items in Central Warehouse (exclude unlimited stock items)
  const lowStockItems = items.filter(item => {
    if (item.is_unlimited || item.is_archived) return false;
    const inv = hubInventories.find(i => i.item_id === item.id);
    const available = inv ? inv.stock_available : 0;
    return available <= item.safety_stock;
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider bg-orange-500/10 text-orange-600 border-orange-300 dark:border-orange-800">
              Hub Master
            </Badge>
            <span className="text-xs font-semibold text-foreground">
              Gudang Pusat
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Distribusi Stok & Logistik
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen stok hub, otorisasi permohonan toko cabang & dispatch pengiriman armada.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => onNavigate('warehouse_approval_queue')}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Otorisasi ({pendingRequests.length})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('warehouse_master_items')}
            className="text-xs font-bold gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>Katalog Barang</span>
          </Button>
        </div>
      </div>

      {/* 2. Real In-Transit Shipments Alert with Live GSAP Horizon Looper */}
      {inTransitShipments.length > 0 && (
        <div className="space-y-3">
          {inTransitShipments.map(req => {
            const toLoc = locMap.get(req.to_location_id);
            const totalDispatched = req.items.reduce((s, i) => s + (i.qty_dispatched || i.qty_requested), 0);

            return (
              <div key={req.id} className="space-y-2">
                <WorkflowStatusLooper
                  status={req.status}
                  fromName="Gudang Pusat"
                  toName={toLoc?.name || 'Toko Cabang'}
                  doNumber={req.do_number || req.request_number}
                  totalQty={totalDispatched}
                />
                <div className="flex items-center justify-end gap-2 px-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTrackingReq(req)}
                    className="text-xs h-8 text-orange-600 border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-950"
                  >
                    <Truck className="w-3.5 h-3.5 mr-1" />
                    Lacak Rute
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSuratJalanReq(req)}
                    className="text-xs h-8"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    Surat Jalan DO
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Real Bento Grid KPI Metrics */}
      <div className="flex lg:grid lg:grid-cols-4 gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 snap-x snap-mandatory">
        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Stok Tersedia"
            value={formatNumber(totalAvailableStock)}
            subtitle={`${items.length} Master SKU`}
            icon={Package}
            color="emerald"
          />
        </div>

        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Disiapkan (Reserved)"
            value={formatNumber(totalReservedStock)}
            subtitle={`${readyDispatch.length} DO Siap Kirim`}
            icon={Boxes}
            color="indigo"
          />
        </div>

        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Di Jalan (In-Transit)"
            value={formatNumber(totalInTransitStock)}
            subtitle={`${inTransitShipments.length} Armada OTW`}
            icon={Truck}
            color="blue"
          />
        </div>

        <div className="min-w-[135px] sm:min-w-0 snap-start flex-1">
          <StatCard
            title="Perlu Review"
            value={pendingRequests.length}
            subtitle="Permintaan Masuk"
            icon={Clock}
            color="amber"
          />
        </div>
      </div>

      {/* 4. Branch Inventory Cards */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xs font-bold tracking-tight uppercase text-muted-foreground">
              Ketersediaan Stok di 3 Toko Cabang
            </CardTitle>
            <CardDescription className="text-[11px] text-muted-foreground">
              Data stok sinkron langsung dari sistem database.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(storeId => {
              const storeLoc = locMap.get(storeId);
              const storeInvs = inventories.filter(inv => inv.location_id === storeId);
              const totalStock = storeInvs.reduce((sum, inv) => sum + inv.stock_available, 0);
              const storeInTransit = requests
                .filter(r => r.to_location_id === storeId && r.status === 'IN_TRANSIT')
                .reduce((sum, r) => sum + r.items.reduce((iSum, i) => iSum + (i.qty_dispatched || 0), 0), 0);

              return (
                <div
                  key={storeId}
                  className="p-3.5 rounded-xl bg-muted/30 border border-border flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground">
                        {storeLoc?.name.replace(' (Cabang Barat)', '').replace(' (Cabang Selatan)', '').replace(' (Cabang Timur)', '')}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">Cabang #{storeId}</span>
                  </div>

                  <div>
                    <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-foreground">
                      {formatNumber(totalStock)}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-1.5">unit fisik</span>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">In-Transit:</span>
                    {storeInTransit > 0 ? (
                      <Badge variant="outline" className="text-[10px] font-mono font-bold text-orange-600 border-orange-300">
                        +{storeInTransit} Unit
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0 Unit</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 5. Two-Column Operational Bento: Pending Queue & Stock Monitor */}
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
            {requests.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('warehouse_approval_queue')}
                className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                Lihat Semua &rarr;
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-3">
            {requests.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Belum ada permintaan dari toko</p>
                <p className="text-[11px] mt-0.5">Semua cabang belum mengajukan kebutuhan stok.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 4).map(req => {
                  const toLoc = locMap.get(req.to_location_id);
                  const totalQty = req.items.reduce((s, i) => s + (i.qty_requested || 0), 0);

                  return (
                    <div
                      key={req.id}
                      onClick={() => setTrackingReq(req)}
                      className="p-3 rounded-xl bg-card border border-border hover:border-orange-500/50 flex items-center justify-between text-xs transition-all cursor-pointer shadow-xs group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground group-hover:text-orange-600 transition-colors">
                            {req.do_number || req.request_number}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground font-medium">
                            {toLoc?.name.split(' ')[0]} Cabang {req.to_location_id}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          Total: <strong className="font-mono text-foreground">{totalQty}</strong> Unit ({req.items.length} item)
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
              <Package className="w-4 h-4 text-orange-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Pantauan Stok Gudang Pusat ({items.length} SKU)
              </CardTitle>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('warehouse_master_items')}
                className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                Kelola Stok &rarr;
              </Button>
            )}
          </CardHeader>

          <CardContent className="pt-3">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Master barang masih 0</p>
                <p className="text-[11px] mt-0.5">Mulai dengan mendaftarkan produk di menu Master Barang.</p>
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Semua {items.length} barang di gudang pusat berada di atas batas safety stock.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.slice(0, 4).map(item => {
                  const inv = hubInventories.find(i => i.item_id === item.id);
                  const available = inv ? inv.stock_available : 0;
                  const isOutOfStock = available <= 0;

                  return (
                    <div 
                      key={item.id} 
                      className="p-3 rounded-lg bg-card border border-border flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">
                            {item.name}
                          </span>
                          <Badge variant="outline" className={`text-[9px] font-bold ${
                            isOutOfStock ? 'text-rose-600 border-rose-300' : 'text-amber-600 border-amber-300'
                          }`}>
                            {isOutOfStock ? 'Stok Kosong' : 'Menipis'}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono tabular-nums text-sm font-semibold ${
                          isOutOfStock ? 'text-rose-600' : 'text-amber-600'
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