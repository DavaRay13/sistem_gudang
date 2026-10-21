import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { InboundStockModal } from './InboundStockModal';
import { OutboundStockModal } from './OutboundStockModal';
import { 
  Package, Plus, ArrowDownRight, ArrowUpRight, Search, 
  ShieldAlert, Boxes, Download, Trash2, Pencil
} from 'lucide-react';
import { Item } from '../../types';
import { formatNumber, formatRupiah } from '../../utils/formatters';
import { exportMasterItemsToExcel } from '../../utils/exportHelpers';

export const MasterItemManagement: React.FC = () => {
  const { items, inventories, addNewItem, updateItem, deleteItem, inboundStock } = useInventory();
  const { locations, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EMPTY' | 'LOW' | 'AVAILABLE'>('ALL');
  
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
    safety_stock: number | string;
    initial_stock: number | string;
  }>({
    name: '',
    category: 'Elektronik',
    unit: 'PCS',
    price: 50000,
    safety_stock: 10,
    initial_stock: '',
  });

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
    if (!formData.name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Auto-generate internal unique SKU
      const autoSku = 'BRG-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
      const created = await addNewItem({
        sku: autoSku,
        name: formData.name.trim(),
        category: formData.category.trim(),
        unit: formData.unit.trim().toUpperCase(),
        price: Number(formData.price) || 0,
        safety_stock: Number(formData.safety_stock) || 0,
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
      setFormData({
        name: '',
        category: 'Elektronik',
        unit: 'PCS',
        price: 50000,
        safety_stock: 10,
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <span>Daftar Barang & Stok</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            {activeItems.length} jenis barang terdaftar di Gudang Pusat
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportExcel}
            disabled={activeItems.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
            title="Download Data Barang & Stok ke Excel"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => {
              setSelectedInboundItemId(activeItems[0]?.id);
              setIsInboundOpen(true);
            }}
            disabled={activeItems.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Stok Masuk</span>
          </button>

          <button
            onClick={() => {
              setSelectedOutboundItemId(activeItems[0]?.id);
              setIsOutboundOpen(true);
            }}
            disabled={activeItems.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
            title="Keluarkan stok (rusak, retur vendor, selisih)"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Keluarkan Stok</span>
          </button>

          <button
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Search, Status & Category Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama barang..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
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

      {/* Mobile Card List View */}
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
      ) : (
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
        onClose={() => setIsAddItemOpen(false)}
        title="Tambah Data Barang Baru"
        subtitle="Barang baru akan terdaftar di katalog dan bisa diminta oleh toko cabang"
        maxWidth="md"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Barang / Produk
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Wireless Barcode Scanner 2D"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori
              </label>
              <input
                type="text"
                required
                placeholder="Elektronik"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
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
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold uppercase focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                value={formData.price}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, price: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                }}
                onBlur={() => {
                  if (formData.price === '') {
                    setFormData(prev => ({ ...prev, price: 0 }));
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
                value={formData.safety_stock}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, safety_stock: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                }}
                onBlur={() => {
                  if (formData.safety_stock === '') {
                    setFormData(prev => ({ ...prev, safety_stock: 0 }));
                  }
                }}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Opsi Stok Awal Gudang Pusat */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Stok Awal di Gudang Pusat (Opsional)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Jika diisi, saldo stok barang akan langsung tercatat dan masuk ke database Gudang Pusat.
            </p>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Jumlah Stok Masuk Awal ({formData.unit || 'Unit'})
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 100 (opsional)"
                value={formData.initial_stock}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, initial_stock: val === '' ? '' : Math.max(0, parseInt(val) || 0) });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddItemOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data Barang'}
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="grid grid-cols-2 gap-3">
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setItemToEdit(null)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isEditing}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
