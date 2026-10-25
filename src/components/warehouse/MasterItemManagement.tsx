import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { InboundStockModal } from './InboundStockModal';
import { OutboundStockModal } from './OutboundStockModal';
import { 
  Package, Plus, ArrowDownRight, ArrowUpRight, Search, 
  ShieldAlert, Boxes, Download, Trash2, Pencil, Sparkles,
  LayoutList, LayoutGrid
} from 'lucide-react';
import { Item } from '../../types';
import { formatNumber, formatRupiah } from '../../utils/formatters';
import { exportMasterItemsToExcel } from '../../utils/exportHelpers';

interface ItemPreset {
  name: string;
  category: string;
  unit: string;
  price: number;
}

const COMMON_ITEM_CATALOG: ItemPreset[] = [
  { name: 'Minyak Goreng 2L', category: 'Sembako', unit: 'POUCH', price: 34000 },
  { name: 'Minyak Goreng 2L (Dus/Karton)', category: 'Sembako', unit: 'DUS', price: 198000 },
  { name: 'Beras Premium 5kg', category: 'Sembako', unit: 'KARUNG', price: 72000 },
  { name: 'Gula Pasir 1kg', category: 'Sembako', unit: 'PACK', price: 17500 },
  { name: 'Gula Pasir 1kg (Dus/Karton)', category: 'Sembako', unit: 'DUS', price: 345000 },
  { name: 'Tepung Terigu Segitiga 1kg', category: 'Sembako', unit: 'PACK', price: 13000 },
  { name: 'Mie Instan Goreng (Dus)', category: 'Makanan', unit: 'DUS', price: 115000 },
  { name: 'Mie Instan Kuah (Dus)', category: 'Makanan', unit: 'DUS', price: 110000 },
  { name: 'Kopi Kapal Api 1 Renteng', category: 'Minuman', unit: 'RENCENG', price: 14000 },
  { name: 'Kopi Instant Sachet (Dus)', category: 'Minuman', unit: 'DUS', price: 135000 },
  { name: 'Air Mineral 600ml (Dus)', category: 'Minuman', unit: 'DUS', price: 48000 },
  { name: 'Air Mineral Gelas 240ml (Dus)', category: 'Minuman', unit: 'DUS', price: 24000 },
  { name: 'Susu UHT 1L (Dus/Karton)', category: 'Minuman', unit: 'KARTON', price: 215000 },
  { name: 'Sabun Cuci Piring 750ml', category: 'Kebersihan', unit: 'POUCH', price: 14500 },
  { name: 'Sabun Cuci Piring (Dus)', category: 'Kebersihan', unit: 'DUS', price: 165000 },
  { name: 'Deterjen Bubuk 800g', category: 'Kebersihan', unit: 'PACK', price: 19500 },
  { name: 'Kertas Thermal Roll 80x80 (Isi 10)', category: 'Perlengkapan Kasir', unit: 'PACK', price: 65000 },
  { name: 'Kertas Thermal Roll 58x40 (Isi 10)', category: 'Perlengkapan Kasir', unit: 'PACK', price: 45000 },
  { name: 'Lakban Coklat 2 Inch (Dus)', category: 'Logistik', unit: 'DUS', price: 185000 },
  { name: 'Plastik Packing Roll', category: 'Logistik', unit: 'ROLL', price: 42000 },
  { name: 'Wireless Barcode Scanner 2D', category: 'Elektronik', unit: 'UNIT', price: 450000 },
  { name: 'Thermal Receipt Printer 80mm', category: 'Elektronik', unit: 'UNIT', price: 750000 },
];

const QUICK_CATEGORIES = ['Sembako', 'Makanan', 'Minuman', 'Kebersihan', 'Perlengkapan Kasir', 'Logistik', 'Elektronik', 'Umum'];
const QUICK_UNITS = ['DUS', 'PACK', 'PCS', 'KARTON', 'RENCENG', 'BOX', 'KARUNG', 'POUCH'];

export const MasterItemManagement: React.FC = () => {
  const { items, inventories, addNewItem, updateItem, deleteItem, inboundStock } = useInventory();
  const { locations, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EMPTY' | 'LOW' | 'AVAILABLE'>('ALL');
  const [viewMode, setViewMode] = useState<'compact' | 'card'>('compact');
  
  // Modals state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isInboundOpen, setIsInboundOpen] = useState(false);
  const [selectedInboundItemId, setSelectedInboundItemId] = useState<number | undefined>(undefined);
  const [isOutboundOpen, setIsOutboundOpen] = useState(false);
  const [selectedOutboundItemId, setSelectedOutboundItemId] = useState<number | undefined>(undefined);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit item state
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    category: string;
    unit: string;
    price: number | string;
    safety_stock: number | string;
  }>({
    name: '',
    category: 'Elektronik',
    unit: 'PCS',
    price: 50000,
    safety_stock: 10,
  });

  const openEditModal = (item: Item) => {
    setItemToEdit(item);
    setEditFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      price: item.price,
      safety_stock: item.safety_stock,
    });
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit || !editFormData.name || isEditing) return;

    setIsEditing(true);
    try {
      await updateItem(itemToEdit.id, {
        sku: itemToEdit.sku,
        name: editFormData.name.trim(),
        category: editFormData.category.trim(),
        unit: editFormData.unit.trim().toUpperCase(),
        price: Number(editFormData.price) || 0,
        safety_stock: Number(editFormData.safety_stock) || 0,
      });
      setItemToEdit(null);
    } catch {
      // Handled by toast
    } finally {
      setIsEditing(false);
    }
  };

  // Helper to get inventory
  const getInv = (locationId: number, itemId: number) => {
    return inventories.find(inv => inv.location_id === locationId && inv.item_id === itemId) || {
      stock_available: 0,
      stock_reserved: 0,
      stock_in_transit: 0,
    };
  };

  const activeItems = items.filter(i => !i.is_archived);

  const emptyStockCount = activeItems.filter(i => getInv(0, i.id).stock_available <= 0).length;
  const lowStockCount = activeItems.filter(i => {
    const avail = getInv(0, i.id).stock_available;
    return avail > 0 && avail <= i.safety_stock;
  }).length;

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteItem(itemToDelete.id);
      setItemToDelete(null);
    } catch {
      // Toast handles error
    } finally {
      setIsDeleting(false);
    }
  };

  // Form State New Item
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    unit: string;
    price: number | string;
    initial_stock: number | string;
  }>({
    name: '',
    category: 'Sembako',
    unit: 'DUS',
    price: '',
    initial_stock: '',
  });

  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  // Pool rekomendasi: gabungan katalog preset umum + data master SKU yang sudah ada di sistem
  const suggestionsPool: ItemPreset[] = [
    ...COMMON_ITEM_CATALOG,
    ...activeItems.map(it => ({
      name: it.name,
      category: it.category,
      unit: it.unit,
      price: it.price || 0,
    })),
  ];

  // Hapus duplikat berdasarkan nama (lowercase)
  const uniqueSuggestions = Array.from(
    new Map(suggestionsPool.map(item => [item.name.toLowerCase().trim(), item])).values()
  );

  const filteredSuggestions = formData.name.trim() === ''
    ? uniqueSuggestions.slice(0, 6)
    : uniqueSuggestions
        .filter(item => item.name.toLowerCase().includes(formData.name.toLowerCase().trim()))
        .slice(0, 8);

  const handleSelectSuggestion = (preset: ItemPreset) => {
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      category: preset.category || prev.category,
      unit: preset.unit || prev.unit,
      price: preset.price > 0 ? preset.price : prev.price,
    }));
    setShowNameSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target as Node)) {
        setShowNameSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['ALL', ...Array.from(new Set(activeItems.map(i => i.category || 'Umum')))];

  const filteredItems = activeItems.filter(item => {
    const itemName = item?.name || '';
    const matchSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    if (!matchSearch || !matchCategory) return false;

    const hubInv = getInv(0, item.id);
    const isOut = hubInv.stock_available <= 0;
    const isLow = !isOut && hubInv.stock_available <= item.safety_stock;

    if (statusFilter === 'EMPTY') return isOut;
    if (statusFilter === 'LOW') return isLow;
    if (statusFilter === 'AVAILABLE') return !isOut && !isLow;

    return true;
  });

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Auto-generate internal unique SKU
      const autoSku = 'BRG-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
      const created = await addNewItem({
        sku: autoSku,
        name: formData.name.trim(),
        category: formData.category.trim() || 'Umum',
        unit: formData.unit.trim().toUpperCase() || 'PCS',
        price: Number(formData.price) || 0,
        safety_stock: 0,
      });

      // Otomatis catat saldo stok awal ke database jika kuantiti diisi
      const initStock = Number(formData.initial_stock) || 0;
      if (initStock > 0 && currentUser) {
        await inboundStock(
          created.id,
          initStock,
          'Saldo stok awal saat pendaftaran barang baru',
          currentUser.id
        );
      }

      setIsAddItemOpen(false);
      setShowNameSuggestions(false);
      setFormData({
        name: '',
        category: 'Sembako',
        unit: 'DUS',
        price: '',
        initial_stock: '',
      });
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInboundForItem = (itemId: number) => {
    setSelectedInboundItemId(itemId);
    setIsInboundOpen(true);
  };

  const openOutboundForItem = (itemId: number) => {
    setSelectedOutboundItemId(itemId);
    setIsOutboundOpen(true);
  };

  const handleExportExcel = () => {
    exportMasterItemsToExcel(
      filteredItems,
      inventories,
      locations,
      currentUser?.full_name || 'Admin Gudang Pusat'
    );
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <span>Daftar Barang & Stok</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {activeItems.length} jenis barang terdaftar di Gudang Pusat
          </p>
        </div>

        <div className="grid grid-cols-4 sm:flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={activeItems.length === 0}
            className="flex items-center justify-center gap-1 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
            title="Download Data Barang & Stok ke Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedInboundItemId(activeItems[0]?.id);
              setIsInboundOpen(true);
            }}
            disabled={activeItems.length === 0}
            className="flex items-center justify-center gap-1 px-2 py-2 sm:px-2.5 rounded-xl text-xs font-bold text-foreground bg-card border border-border hover:bg-muted shadow-2xs active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+ Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedOutboundItemId(activeItems[0]?.id);
              setIsOutboundOpen(true);
            }}
            disabled={activeItems.length === 0}
            className="flex items-center justify-center gap-1 px-2 py-2 sm:px-2.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 shadow-2xs active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap"
            title="Keluarkan stok (rusak, retur vendor, selisih)"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>- Keluar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center justify-center gap-1 px-2 py-2 sm:px-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-xs active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ SKU Baru</span>
          </button>
        </div>
      </div>

      {/* Search, Status & Category Filters */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama barang..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>

          {/* Toggle View Mode: Compact vs Card */}
          <div className="flex items-center p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'compact'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Mode Baris Rapat (Muat Banyak Barang)"
            >
              <LayoutList className="w-4 h-4" />
              <span className="text-[10px] font-bold hidden sm:inline">Rapat</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'card'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Mode Kartu Lapang"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[10px] font-bold hidden sm:inline">Kartu</span>
            </button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter('EMPTY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 ${
              statusFilter === 'EMPTY'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100/70'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Stok Kosong ({emptyStockCount})
          </button>
          <button
            onClick={() => setStatusFilter('LOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 ${
              statusFilter === 'LOW'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50 hover:bg-amber-100/70'
            }`}
          >
            Menipis ({lowStockCount})
          </button>
          <button
            onClick={() => setStatusFilter('AVAILABLE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              statusFilter === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100/70'
            }`}
          >
            Stok Tersedia
          </button>
        </div>

        {/* Horizontal Category Scroll for touch */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item List View: Compact Row or Card Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Boxes className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {statusFilter === 'EMPTY' ? 'Tidak Ada Barang dengan Stok Kosong' : 'Belum Ada Master SKU'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {statusFilter === 'EMPTY'
              ? 'Seluruh jenis barang memiliki stok di atas 0 unit.'
              : 'Tambahkan SKU baru atau gunakan tombol "Data Demo" di pojok kanan atas.'}
          </p>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setSelectedCategory('ALL');
              setIsAddItemOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah SKU</span>
          </button>
        </div>
      ) : viewMode === 'compact' ? (
        /* MODE RAPAT: Format Baris Rapat / Compact Rows (Muat Banyak Barang) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {filteredItems.map(item => {
            const hubInv = getInv(0, item.id);
            const store1Inv = getInv(1, item.id);
            const store2Inv = getInv(2, item.id);
            const store3Inv = getInv(3, item.id);

            const isOutOfStock = hubInv.stock_available <= 0;
            const isLowStockInHub = !isOutOfStock && hubInv.stock_available <= item.safety_stock;

            return (
              <div
                key={item.id}
                className="bg-card rounded-xl border border-border p-2.5 sm:p-3 shadow-2xs hover:border-foreground/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                {/* Kolom Kiri: Dot Indikator + Nama + Kategori/Harga */}
                <div className="min-w-0 flex-1 flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isOutOfStock
                          ? 'bg-rose-500 animate-pulse'
                          : isLowStockInHub
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      title={isOutOfStock ? 'Stok Kosong' : isLowStockInHub ? 'Stok Menipis' : 'Stok Tersedia'}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs sm:text-sm text-foreground leading-tight truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                        <span className="text-foreground/80 font-semibold">{item.category}</span>
                        <span>·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(item.price || 0)}</span>
                        <span>·</span>
                        <span>/{item.unit || 'PCS'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock counter on mobile sits on top-right */}
                  <div className="sm:hidden text-right shrink-0 px-2 py-1 rounded-lg bg-muted/60">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className={`text-xs font-black font-mono tabular-nums leading-none ${
                        isOutOfStock
                          ? 'text-rose-600 dark:text-rose-400'
                          : isLowStockInHub
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-foreground'
                      }`}>
                        {formatNumber(hubInv.stock_available)}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase">{item.unit || 'PCS'}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop: Middle Stock + Mobile: Bottom Row with Breakdown & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  {/* Stock counter desktop */}
                  <div className="hidden sm:block text-right shrink-0 px-2.5 py-1 rounded-lg bg-muted/50">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className={`text-sm font-black font-mono tabular-nums leading-none ${
                        isOutOfStock
                          ? 'text-rose-600 dark:text-rose-400'
                          : isLowStockInHub
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-foreground'
                      }`}>
                        {formatNumber(hubInv.stock_available)}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase">{item.unit || 'PCS'}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono mt-0.5 whitespace-nowrap">
                      T1:{store1Inv.stock_available} T2:{store2Inv.stock_available} T3:{store3Inv.stock_available}
                    </div>
                  </div>

                  {/* Mobile breakdown only */}
                  <div className="sm:hidden text-[9.5px] text-muted-foreground font-mono">
                    T1:{store1Inv.stock_available} T2:{store2Inv.stock_available} T3:{store3Inv.stock_available}
                  </div>

                  {/* Kolom Kanan: Aksi Cepat Mini */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openInboundForItem(item.id)}
                      className="h-8 px-2 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1"
                      title="Tambah Stok Masuk"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span className="sm:hidden">Masuk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openOutboundForItem(item.id)}
                      className="h-8 px-2 rounded-lg text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 hover:bg-rose-100 active:scale-95 transition-all flex items-center gap-1"
                      title="Keluarkan Stok"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span className="sm:hidden">Keluar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground bg-muted active:scale-95 transition-all flex items-center justify-center"
                      title="Edit Data Barang"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="w-8 h-8 rounded-lg text-rose-500 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 active:scale-95 transition-all flex items-center justify-center"
                      title="Hapus Barang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE KARTU: Tampilan Kartu Lapang */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {filteredItems.map(item => {
            const hubInv = getInv(0, item.id);
            const store1Inv = getInv(1, item.id);
            const store2Inv = getInv(2, item.id);
            const store3Inv = getInv(3, item.id);

            const isOutOfStock = hubInv.stock_available <= 0;
            const isLowStockInHub = !isOutOfStock && hubInv.stock_available <= item.safety_stock;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Top: Name + Status + Price */}
                <div className="p-3.5 pb-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[13px] text-slate-900 dark:text-white leading-snug truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(item.price || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          Kosong
                        </span>
                      ) : isLowStockInHub ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="w-3 h-3 shrink-0" />
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Tersedia
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Bar - Visual & Compact */}
                <div className="mx-3.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className={`text-lg font-black font-mono tabular-nums block leading-none ${
                        isOutOfStock
                          ? 'text-rose-600 dark:text-rose-400'
                          : isLowStockInHub
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-white'
                      }`}>
                        {formatNumber(hubInv.stock_available)}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold mt-0.5 block">Tersedia</span>
                    </div>
                    <div>
                      <span className="text-lg font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400 block leading-none">
                        {formatNumber(hubInv.stock_reserved)}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold mt-0.5 block">Disiapkan</span>
                    </div>
                    <div>
                      <span className="text-lg font-black font-mono tabular-nums text-blue-600 dark:text-blue-400 block leading-none">
                        {formatNumber(hubInv.stock_in_transit)}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold mt-0.5 block">Di Jalan</span>
                    </div>
                  </div>
                </div>

                {/* Store breakdown */}
                <div className="mx-3.5 mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Cabang</span>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">T1:{store1Inv.stock_available}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">T2:{store2Inv.stock_available}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">T3:{store3Inv.stock_available}</span>
                  </div>
                </div>

                {/* Action Buttons - Thumb-friendly row */}
                <div className="mt-2.5 p-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <button
                    onClick={() => openInboundForItem(item.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 active:scale-95 transition-all"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Masuk</span>
                  </button>
                  <button
                    onClick={() => openOutboundForItem(item.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 active:scale-95 transition-all"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Keluar</span>
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 active:scale-90 transition-all shrink-0"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 active:scale-90 transition-all shrink-0"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Item */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          setShowNameSuggestions(false);
        }}
        title="Tambah Barang Baru"
        subtitle="Form ringkas: ketik nama untuk rekomendasi instan, kategori, satuan, harga, dan stok masuk"
        maxWidth="md"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          {/* Nama Barang dengan Autocomplete Pintar */}
          <div className="relative" ref={suggestionBoxRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nama Barang / Produk
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                <Sparkles className="w-3 h-3" />
                Rekomendasi Otomatis
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="Ketik nama... (misal: Minyak Goreng, Beras, Kopi, Mie)"
                value={formData.name}
                onFocus={() => setShowNameSuggestions(true)}
                onChange={e => {
                  setFormData({ ...formData, name: e.target.value });
                  setShowNameSuggestions(true);
                }}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {formData.name && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, name: '' });
                    setShowNameSuggestions(true);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown Rekomendasi Nama Relevan */}
            {showNameSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Pilih Rekomendasi Relevan</span>
                  <span className="text-[9px] font-normal text-slate-400">Otomatis isi kategori & satuan</span>
                </div>
                {filteredSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-brand-50/70 dark:hover:bg-brand-950/30 flex items-center justify-between gap-2 group transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 block truncate">
                        {suggestion.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {suggestion.category}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          / {suggestion.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {suggestion.price > 0 ? formatRupiah(suggestion.price) : '-'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kategori (Bisa Ketik Bebas + Chip Cepat) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Kategori (Ketik Bebas)
              </label>
              <span className="text-[10px] text-slate-400">atau klik pilihan cepat</span>
            </div>
            <input
              type="text"
              required
              placeholder="Contoh: Sembako, Makanan, Minuman, Logistik..."
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {QUICK_CATEGORIES.map(cat => {
                const isSelected = formData.category.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Satuan & Harga (Grid 2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Satuan (Bisa Ketik Bebas / Pack / Dus dsb) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Satuan Kemasan
                </label>
              </div>
              <input
                type="text"
                required
                placeholder="DUS, PACK, PCS, dll"
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {/* Quick Unit Chips */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {QUICK_UNITS.map(u => {
                  const isSelected = formData.unit.toUpperCase() === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setFormData({ ...formData, unit: u })}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      /{u}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Harga Satuan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Harga Satuan (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="50000"
                value={formData.price}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, price: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {formData.price ? formatRupiah(Number(formData.price)) : 'Rp 0'}
              </span>
            </div>
          </div>

          {/* Jumlah Stok Masuk ke Gudang Pusat */}
          <div className="p-3.5 rounded-2xl bg-card border border-emerald-300 dark:border-emerald-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-foreground">
                  Jumlah Stok Masuk (Gudang Pusat)
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                Saldo Awal
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Kuantitas barang yang langsung tersedia di Gudang Pusat saat disimpan.
            </p>

            <div className="space-y-2">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.initial_stock}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, initial_stock: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {/* Stepper buttons wrapped for mobile */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-muted-foreground mr-0.5">Tambah cepat:</span>
                {[5, 10, 25, 50, 100].map(addQty => (
                  <button
                    key={addQty}
                    type="button"
                    onClick={() => {
                      const cur = Number(formData.initial_stock) || 0;
                      setFormData({ ...formData, initial_stock: cur + addQty });
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-muted text-foreground border border-border hover:bg-muted/80 active:scale-95 transition-all"
                  >
                    +{addQty}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-border sticky bottom-0 bg-card py-2 -mx-1 px-1">
            <button
              type="button"
              onClick={() => {
                setIsAddItemOpen(false);
                setShowNameSuggestions(false);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Barang Baru'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Item */}
      <Modal
        isOpen={Boolean(itemToEdit)}
        onClose={() => setItemToEdit(null)}
        title="Edit Data Barang"
        subtitle={`Perbarui informasi data barang: ${itemToEdit?.name || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Barang / Produk
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Wireless Barcode Scanner 2D"
              value={editFormData.name}
              onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori
              </label>
              <input
                type="text"
                required
                placeholder="Elektronik"
                value={editFormData.category}
                onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Satuan (Contoh: PCS, BOX)
              </label>
              <input
                type="text"
                required
                placeholder="PCS / BOX"
                value={editFormData.unit}
                onChange={e => setEditFormData({ ...editFormData, unit: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Harga Satuan (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                placeholder="50000"
                value={editFormData.price}
                onChange={e => {
                  const val = e.target.value;
                  setEditFormData({ ...editFormData, price: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                }}
                onBlur={() => {
                  if (editFormData.price === '') {
                    setEditFormData(prev => ({ ...prev, price: 0 }));
                  }
                }}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Batas Minimum Stok Aman
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="10"
                value={editFormData.safety_stock}
                onChange={e => {
                  const val = e.target.value;
                  setEditFormData({ ...editFormData, safety_stock: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                }}
                onBlur={() => {
                  if (editFormData.safety_stock === '') {
                    setEditFormData(prev => ({ ...prev, safety_stock: 0 }));
                  }
                }}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t border-border sticky bottom-0 bg-card py-2 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setItemToEdit(null)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-all text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isEditing}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
            >
              {isEditing ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus Barang */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Hapus Data Barang & SKU"
        subtitle="Konfirmasi penghapusan data master barang dari katalog"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-2">
            <p className="font-bold text-sm text-rose-700 dark:text-rose-300">Konfirmasi Penghapusan Barang</p>
            <p>
              Apakah Anda yakin ingin menghapus barang <strong className="font-bold text-slate-900 dark:text-white">"{itemToDelete?.name}"</strong>?
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Barang dan saldo stok aktif akan dihapus dari katalog Gudang dan Toko. Seluruh catatan riwayat mutasi dan dokumen transfer masa lalu tetap tersimpan utuh dan tidak akan hilang.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteItem}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Barang'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Inbound */}
      <InboundStockModal
        isOpen={isInboundOpen}
        onClose={() => setIsInboundOpen(false)}
        items={activeItems}
        preselectedItemId={selectedInboundItemId}
      />

      {/* Modal Outbound */}
      <OutboundStockModal
        isOpen={isOutboundOpen}
        onClose={() => setIsOutboundOpen(false)}
        items={activeItems}
        preselectedItemId={selectedOutboundItemId}
      />
    </div>
  );
};
