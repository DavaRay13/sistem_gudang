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
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
              Hub Operasional
            </Badge>
            <span className="text-xs text-muted-foreground">
              Gudang Pusat
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Distribusi Stok & Logistik Cabang
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan saldo stok, verifikasi permintaan toko, dan pengiriman barang terpadu.
          </p>
        </div>

        {/* Utilitarian Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => onNavigate('warehouse_approval_queue')}
            className="gap-2"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Otorisasi ({pendingRequests.length})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('warehouse_master_items')}
            className="gap-1.5"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Stok Masuk</span>
          </Button>
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
          <Badge variant="outline" className="text-[10px] font-mono uppercase bg-[#EDF3EC] text-[#346538] dark:bg-[#172B19] dark:text-[#96D99C] border-[#D4E5D3] dark:border-[#223F25]">
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
                      <Badge variant="outline" className="text-[10px] font-mono font-medium bg-[#E1F3FE] text-[#1F6C9F] dark:bg-[#142838] dark:text-[#97D2FB] border-[#C8E7FD] dark:border-[#1E3B52]">
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
                      className="p-3 rounded-lg bg-muted/40 border border-border hover:border-foreground/20 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-foreground">
                            {req.request_number}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {toLoc?.name.split(' ')[0]} Cabang {req.to_location_id}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          Total Permintaan: <strong className="font-mono text-foreground">{totalQty}</strong> Unit ({req.items.length} item)
                        </span>
                      </div>
                      <StatusBadge status={req.status} size="sm" />
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
              <ShieldAlert className="w-4 h-4 text-[#956400] dark:text-[#E8CA65]" />
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
                            <Badge variant="outline" className="text-[10px] font-mono bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[#381B1B] dark:text-[#F8A4A4] border-[#F8D2D4] dark:border-[#522525]">
                              Stok Kosong
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-mono bg-[#FBF3DB] text-[#956400] dark:bg-[#332A15] dark:text-[#E8CA65] border-[#F4E3B4] dark:border-[#4D3F1E]">
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
                          isOutOfStock ? 'text-destructive' : 'text-[#956400] dark:text-[#E8CA65]'
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
    </div>
  );
};
