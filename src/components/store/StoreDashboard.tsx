import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { CreateRequestModal } from './CreateRequestModal';
import { ReceivingHandshakeModal } from './ReceivingHandshakeModal';
import { ShipmentTrackingModal } from '../documents/ShipmentTrackingModal';
import { SuratJalanModal } from '../documents/SuratJalanModal';
import { NavigationTab } from '../layout/Sidebar';
import { TransferRequest } from '../../types';
import { 
  Package, Truck, Boxes, PlusCircle, CheckSquare, 
  Search, ChevronRight
} from 'lucide-react';
import { formatNumber, formatRupiah, formatDate } from '../../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface StoreDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const StoreDashboard: React.FC<StoreDashboardProps> = ({ onNavigate }) => {
  const { items, inventories, requests } = useInventory();
  const { currentLocation, locations, users } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedItemIdForRequest, setSelectedItemIdForRequest] = useState<number | undefined>(undefined);
  const [activeReceivingReq, setActiveReceivingReq] = useState<TransferRequest | null>(null);
  const [trackingReq, setTrackingReq] = useState<TransferRequest | null>(null);
  const [suratJalanReq, setSuratJalanReq] = useState<TransferRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  const myLocationId = currentLocation?.id || 1;

  // Filter Inventories for current store
  const myInventories = inventories.filter(inv => inv.location_id === myLocationId);
  const totalLocalStock = myInventories.reduce((sum, inv) => sum + inv.stock_available, 0);

  // Filter requests for current store
  const storeRequests = requests.filter(r => r.to_location_id === myLocationId);
  const inTransitRequests = storeRequests.filter(r => r.status === 'IN_TRANSIT');

  // Low stock calculation
  const lowStockItems = items.filter(item => {
    const inv = myInventories.find(i => i.item_id === item.id);
    const available = inv ? inv.stock_available : 0;
    return available > 0 && available <= item.safety_stock;
  });

  // Filtered Items for Catalog Table
  const filteredItems = items.filter(item => {
    const q = searchTerm.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
    if (!nameMatch) return false;

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
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* 1. Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider bg-orange-500/10 text-orange-600 border-orange-300 dark:border-orange-800">
              Toko Cabang
            </Badge>
            <span className="text-xs font-semibold text-foreground">
              {currentLocation?.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Kelola Stok Toko
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pengajuan kebutuhan stok ke gudang pusat & konfirmasi penerimaan barang.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => handleOpenRequestForItem()}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Minta Stok Baru</span>
          </Button>
        </div>
      </div>

      {/* 2. Real In-Transit Shipment Alert (Only rendered if there are real shipments in transit) */}
      {inTransitRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/80 via-white to-orange-50/40 dark:from-orange-950/30 dark:via-card dark:to-orange-950/10 border border-orange-200 dark:border-orange-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Kiriman Menuju Toko ({inTransitRequests.length} Paket)
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              Silakan periksa fisik saat armada tiba
            </span>
          </div>

          <div className="space-y-2">
            {inTransitRequests.map(req => {
              const totalDispatched = req.items.reduce((s, i) => s + (i.qty_dispatched || i.qty_requested), 0);
              return (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-foreground">
                        {req.do_number || req.request_number}
                      </span>
                      <Badge className="bg-orange-500 text-white text-[9px] font-bold">
                        IN TRANSIT
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: <strong>{totalDispatched} unit</strong> ({req.items.length} item) dikirim dari Gudang Pusat
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrackingReq(req)}
                      className="text-xs h-8 text-orange-600 border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-950"
                    >
                      <Truck className="w-3.5 h-3.5 mr-1" />
                      Lacak
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActiveReceivingReq(req)}
                      className="text-xs h-8 bg-orange-600 hover:bg-orange-500 text-white font-bold"
                    >
                      <CheckSquare className="w-3.5 h-3.5 mr-1" />
                      Terima Barang
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Simple Real Metrics (3 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Stok Fisik</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5 block">
            {formatNumber(totalLocalStock)} <span className="text-xs font-normal text-muted-foreground">unit</span>
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Tersedia di {currentLocation?.name}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Katalog Barang</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5 block">
            {items.length} <span className="text-xs font-normal text-muted-foreground">SKU</span>
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            {lowStockItems.length > 0 ? `${lowStockItems.length} perlu restock` : 'Stok aman'}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Permintaan Berjalan</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-foreground mt-0.5 block">
            {storeRequests.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length} <span className="text-xs font-normal text-muted-foreground">berkas</span>
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Menunggu gudang / armada</span>
        </div>
      </div>

      {/* 4. Real Store Request Status */}
      <Card className="shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold tracking-tight uppercase text-muted-foreground">
              Status Permintaan Stok Terkini
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Lacak dokumen permintaan barang yang diajukan ke gudang pusat.
            </p>
          </div>
          {storeRequests.length > 0 && (
            <button
              onClick={() => onNavigate('store_request_history')}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Lihat semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {storeRequests.length === 0 ? (
          <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border">
            <Package className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-bold text-foreground">Belum Ada Permintaan Stok</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs mx-auto">
              Toko Anda belum mengajukan permohonan barang. Klik "+ Minta Stok Baru" di atas untuk mengajukan.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {storeRequests.slice(0, 4).map(req => {
              const totalQty = req.items.reduce((s, i) => s + (i.qty_requested || 0), 0);
              return (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-card border border-border flex items-center justify-between text-xs gap-2 hover:border-orange-500/40 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground truncate">
                        {req.do_number || req.request_number}
                      </span>
                      <Badge variant="outline" className={`text-[9px] font-bold ${
                        req.status === 'COMPLETED' ? 'text-emerald-600 border-emerald-300' :
                        req.status === 'IN_TRANSIT' ? 'text-orange-600 border-orange-300' :
                        req.status === 'REJECTED' ? 'text-rose-600 border-rose-300' : 'text-foreground'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {totalQty} unit • {req.items.length} item • Dibuat {formatDate(req.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrackingReq(req)}
                      className="h-7 text-[11px] text-orange-600 border-orange-200 dark:border-orange-900/60 hover:bg-orange-50"
                    >
                      <Truck className="w-3 h-3 mr-1" />
                      Lacak
                    </Button>
                    {req.status === 'IN_TRANSIT' && (
                      <Button
                        size="sm"
                        onClick={() => setActiveReceivingReq(req)}
                        className="h-7 text-[11px] bg-orange-600 text-white font-bold hover:bg-orange-500"
                      >
                        Terima
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 5. Inventory Stock List */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <CardTitle className="text-xs font-bold tracking-tight uppercase text-muted-foreground">
              Daftar Stok Barang di Toko
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Ketersediaan fisik barang di {currentLocation?.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Cari barang..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant={stockFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStockFilter('ALL')}
                className="h-8 text-xs px-2.5"
              >
                Semua
              </Button>
              <Button
                variant={stockFilter === 'LOW' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStockFilter('LOW')}
                className="h-8 text-xs px-2.5"
              >
                Menipis ({lowStockItems.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {items.length === 0 ? (
            <div className="py-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border">
              <Boxes className="w-9 h-9 text-muted-foreground/30 mx-auto mb-2.5" />
              <p className="text-xs font-bold text-foreground">Database Master Barang Masih Bersih (0 SKU)</p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                Admin Gudang belum mendaftarkan barang. Hubungi Admin Gudang untuk menambahkan master barang baru & stok awal.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              Tidak ada barang yang cocok dengan filter pencarian.
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
                    className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isOutOfStock ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-bold text-foreground truncate block">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground font-mono">
                        <span>{item.category || 'Barang'}</span>
                        <span>•</span>
                        <span className="font-bold text-orange-600 dark:text-orange-400">
                          {formatRupiah(item.price || 0)}
                        </span>
                        <span>/{item.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`font-mono tabular-nums text-xs font-bold block ${
                          isOutOfStock ? 'text-rose-600' : 'text-foreground'
                        }`}>
                          {formatNumber(available)} {item.unit}
                        </span>
                        <Badge variant="outline" className={`text-[8.5px] font-bold ${
                          isOutOfStock ? 'text-rose-600 border-rose-300' :
                          isLow ? 'text-amber-600 border-amber-300' :
                          'text-emerald-600 border-emerald-300'
                        }`}>
                          {isOutOfStock ? 'Habis' : isLow ? 'Menipis' : 'Aman'}
                        </Badge>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRequestForItem(item.id)}
                        className="h-8 px-2.5 text-xs font-semibold gap-1 text-orange-600 border-orange-200 dark:border-orange-900/60 hover:bg-orange-50"
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

      {/* Shipment Live Tracking Modal */}
      {trackingReq && (
        <ShipmentTrackingModal
          isOpen={trackingReq !== null}
          onClose={() => setTrackingReq(null)}
          request={trackingReq}
          locations={locations}
          items={items}
          isStoreStaff={true}
          onOpenHandshake={req => {
            setTrackingReq(null);
            setActiveReceivingReq(req);
          }}
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