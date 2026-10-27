import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { 
  Plus, Trash2, Send, AlertTriangle, 
  FileText, Minus, Search, ChevronDown, Check, X
} from 'lucide-react';
import { formatNumber, formatRupiah } from '../../utils/formatters';
import { Item, Inventory } from '../../types';
import { Badge } from '../ui/badge';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItemId?: number;
}

interface ItemRow {
  itemId: number;
  qtyRequested: number | string;
}

interface SearchableItemPickerProps {
  selectedItemId: number;
  items: Item[];
  inventories: Inventory[];
  onSelect: (itemId: number) => void;
  disabledItemIds?: Set<number>;
}

const SearchableItemPicker: React.FC<SearchableItemPickerProps> = ({
  selectedItemId,
  items,
  inventories,
  onSelect,
  disabledItemIds = new Set(),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find(i => i.id === selectedItemId);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getHubStock = (itemId: number) => {
    return inventories.find(inv => inv.location_id === 0 && inv.item_id === itemId)?.stock_available || 0;
  };

  const filteredItems = items.filter(item => {
    if (item.is_archived) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (item.name || '').toLowerCase().includes(q);
    const catMatch = (item.category || '').toLowerCase().includes(q);
    return nameMatch || catMatch;
  });

  const hubStock = selectedItem ? getHubStock(selectedItem.id) : 0;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full text-left px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 flex items-center justify-between gap-2 text-xs transition-colors shadow-sm"
      >
        <div className="min-w-0 flex-1">
          {selectedItem ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {selectedItem.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                • {formatRupiah(selectedItem.price || 0)} / {selectedItem.unit}
              </span>
            </div>
          ) : (
            <span className="text-slate-400">Pilih Barang...</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedItem && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              hubStock > 0 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
            }`}>
              <span className="hidden sm:inline">Stok Gudang: </span><span className="sm:hidden">Gudang: </span>{formatNumber(hubStock)}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input Bar */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama barang atau kategori..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-1.5 top-1.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Tidak ada barang yang cocok dengan kata kunci "{searchQuery}"
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = item.id === selectedItemId;
                const isAlreadyUsed = !isSelected && disabledItemIds.has(item.id);
                const stock = getHubStock(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 text-xs transition-colors ${
                      isSelected 
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">{formatRupiah(item.price || 0)}</span>
                        <span>/ {item.unit}</span>
                        {isAlreadyUsed && (
                          <span className="text-amber-600 dark:text-amber-400 font-sans italic ml-1">
                            (Sudah ada di daftar)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        stock > 0 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-medium' 
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        Gudang: {formatNumber(stock)} {item.unit}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  initialItemId,
}) => {
  const { items, inventories, requests, createRequest } = useInventory();
  const { currentUser, currentLocation } = useAuth();

  const activeItems = items.filter(i => !i.is_archived);

  const [rows, setRows] = useState<ItemRow[]>(() => {
    if (initialItemId && activeItems.some(i => i.id === initialItemId)) return [{ itemId: initialItemId, qtyRequested: 10 }];
    if (activeItems[0]) return [{ itemId: activeItems[0].id, qtyRequested: 10 }];
    return [];
  });
  const [priority, setPriority] = useState<'EXPRESS' | 'REGULAR' | 'SCHEDULED'>('EXPRESS');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (activeItems.length === 0) {
      setRows([]);
    } else if (initialItemId && activeItems.some(i => i.id === initialItemId)) {
      setRows([{ itemId: initialItemId, qtyRequested: 10 }]);
    } else if (activeItems.length > 0 && (!rows[0] || !activeItems.some(i => i.id === rows[0].itemId))) {
      setRows([{ itemId: activeItems[0].id, qtyRequested: 10 }]);
    }
  }, [items, initialItemId, isOpen]);

  const itemMap = new Map(items.map(i => [i.id, i]));

  // Calculate Total Estimated Value
  const totalEstimatedValue = rows.reduce((sum, row) => {
    const itm = itemMap.get(row.itemId);
    return sum + ((itm?.price || 0) * (Number(row.qtyRequested) || 0));
  }, 0);

  const myLocationId = currentLocation?.id;
  const activePendingReqs = requests.filter(
    r => r.to_location_id === myLocationId && r.status === 'PENDING'
  );

  const pendingItemIds = new Set<number>();
  activePendingReqs.forEach(r => r.items.forEach(i => pendingItemIds.add(i.item_id)));

  const conflictingItems = rows.filter(r => pendingItemIds.has(r.itemId));

  const handleAddRow = () => {
    const usedIds = new Set(rows.map(r => r.itemId));
    const availableItem = activeItems.find(i => !usedIds.has(i.id)) || activeItems[0];
    if (availableItem) {
      setRows([...rows, { itemId: availableItem.id, qtyRequested: 10 }]);
    }
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, field: keyof ItemRow, val: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: val };
    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !myLocationId) return;

    if (items.length === 0) {
      alert('Belum ada master barang di sistem.');
      return;
    }

    const validRows = rows
      .map(r => ({ itemId: r.itemId, qtyRequested: Number(r.qtyRequested) || 0 }))
      .filter(r => r.qtyRequested > 0);

    if (validRows.length === 0) {
      alert('Pilih minimal 1 barang dengan kuantiti > 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const priorityLabel = priority === 'EXPRESS' ? '[Prioritas: Express ⚡]' : priority === 'REGULAR' ? '[Prioritas: Reguler 🚚]' : '[Prioritas: Jadwal Rutin 🏢]';
      const finalNotes = `${priorityLabel} ${notes}`.trim();
      await createRequest(myLocationId, currentUser.id, validRows, finalNotes);
      onClose();
      setRows([{ itemId: items[0]?.id || 1, qtyRequested: 10 }]);
      setNotes('Pengisian stok toko harian');
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const usedItemIds = new Set(rows.map(r => r.itemId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Permintaan Stok Baru"
      subtitle={`Pengajuan kebutuhan dari ${currentLocation?.name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Package / Location & Items Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center text-[11px]">1</span>
            <span>Informasi Lokasi & Barang</span>
          </div>

          {/* Location Origin & Destination Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <span className="text-xs">📍</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Lokasi Asal (Gudang)</span>
                <span className="font-bold text-foreground truncate block">Gudang Pusat</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <span className="text-xs">🏪</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Lokasi Tujuan (Toko)</span>
                <span className="font-bold text-foreground truncate block">{currentLocation?.name}</span>
              </div>
            </div>
          </div>

          {/* Items Input List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pilih Barang & Jumlah yang Diminta:
              </label>
              <button
                type="button"
                onClick={handleAddRow}
                disabled={activeItems.length === 0}
                className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Barang</span>
              </button>
            </div>

            {activeItems.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                Belum ada katalog barang terdaftar di Gudang Pusat.
              </div>
            ) : (
              <div className="space-y-2.5">
                {rows.map((row, idx) => {
                  const currentItem = itemMap.get(row.itemId);
                  const subtotal = (currentItem?.price || 0) * (Number(row.qtyRequested) || 0);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-card rounded-2xl border border-border space-y-2 relative shadow-xs"
                    >
                      {/* Searchable Item Selector */}
                      <div className="flex items-center justify-between gap-2">
                        <SearchableItemPicker
                          selectedItemId={row.itemId}
                          items={activeItems}
                          inventories={inventories}
                          onSelect={newItemId => handleRowChange(idx, 'itemId', newItemId)}
                          disabledItemIds={usedItemIds}
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={rows.length === 1}
                          className="p-2 text-muted-foreground hover:text-rose-500 disabled:opacity-20 active:scale-90 shrink-0"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity Stepper & Subtotal on Mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border">
                        <div className="flex items-center justify-between w-full sm:w-auto">
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            Subtotal: <strong className="text-orange-600 dark:text-orange-400 font-mono">{formatRupiah(subtotal)}</strong>
                          </span>
                          {/* Preset quick buttons on mobile */}
                          <div className="flex items-center gap-1 sm:hidden">
                            {[5, 10, 25].map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleRowChange(idx, 'qtyRequested', (Number(row.qtyRequested) || 0) + preset)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted border border-border text-foreground hover:bg-muted/80 active:scale-95"
                              >
                                +{preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                          {/* Preset on desktop */}
                          <div className="hidden sm:flex items-center gap-1">
                            {[5, 10, 25].map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleRowChange(idx, 'qtyRequested', (Number(row.qtyRequested) || 0) + preset)}
                                className="px-2 py-1 rounded-md text-[10px] font-semibold bg-muted border border-border text-foreground hover:bg-muted/80 active:scale-95"
                              >
                                +{preset}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                            <button
                              type="button"
                              onClick={() => handleRowChange(idx, 'qtyRequested', Math.max(1, (Number(row.qtyRequested) || 0) - 1))}
                              className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center active:scale-90 font-bold border border-border shrink-0"
                              title="Kurang 1"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <input
                              type="number"
                              min="1"
                              required
                              value={row.qtyRequested}
                              onChange={e => {
                                const val = e.target.value;
                                handleRowChange(idx, 'qtyRequested', val === '' ? '' : Math.max(0, parseInt(val) || 0));
                              }}
                              onBlur={() => {
                                if (!row.qtyRequested || Number(row.qtyRequested) < 1) {
                                  handleRowChange(idx, 'qtyRequested', 1);
                                }
                              }}
                              className="w-16 h-9 py-1 text-center font-bold font-mono text-sm rounded-lg border border-border bg-background text-foreground"
                            />

                            <button
                              type="button"
                              onClick={() => handleRowChange(idx, 'qtyRequested', (Number(row.qtyRequested) || 0) + 1)}
                              className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center active:scale-90 font-bold border border-border shrink-0"
                              title="Tambah 1"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Prioritas Pengiriman & Jadwal */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center text-[11px]">2</span>
            <span>Prioritas Pengiriman & Jadwal</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Express Card */}
            <button
              type="button"
              onClick={() => setPriority('EXPRESS')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                priority === 'EXPRESS'
                  ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-2xs font-bold'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span className="text-base block mb-0.5">⚡</span>
              <span className="text-xs font-bold block">Express</span>
              <span className="text-[10px] opacity-75 block">Hari Ini</span>
              <span className={`text-[10px] block mt-1 ${priority === 'EXPRESS' ? 'text-orange-600 font-bold' : 'text-muted-foreground/50'}`}>●</span>
            </button>

            {/* Regular Card */}
            <button
              type="button"
              onClick={() => setPriority('REGULAR')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                priority === 'REGULAR'
                  ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-2xs font-bold'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span className="text-base block mb-0.5">🚚</span>
              <span className="text-xs font-bold block">Reguler</span>
              <span className="text-[10px] opacity-75 block">1-2 Hari</span>
              <span className={`text-[10px] block mt-1 ${priority === 'REGULAR' ? 'text-orange-600 font-bold' : 'text-muted-foreground/50'}`}>●</span>
            </button>

            {/* Scheduled Card */}
            <button
              type="button"
              onClick={() => setPriority('SCHEDULED')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                priority === 'SCHEDULED'
                  ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 shadow-2xs font-bold'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <span className="text-base block mb-0.5">🏢</span>
              <span className="text-xs font-bold block">Rutin</span>
              <span className="text-[10px] opacity-75 block">Mingguan</span>
              <span className={`text-[10px] block mt-1 ${priority === 'SCHEDULED' ? 'text-orange-600 font-bold' : 'text-muted-foreground/50'}`}>●</span>
            </button>
          </div>
        </div>

        {/* Section 3: Ringkasan Permintaan Mutasi */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center text-[11px]">3</span>
            <span>Ringkasan Permintaan Mutasi</span>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Total Kuantitas Barang:</span>
              <span className="font-bold text-foreground font-mono">
                {rows.reduce((s, r) => s + (Number(r.qtyRequested) || 0), 0)} Unit
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Total Nilai Barang:</span>
              <span className="font-bold text-foreground font-mono">
                {formatRupiah(totalEstimatedValue)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Petugas Pemohon:</span>
              <span className="font-semibold text-foreground">{currentUser?.full_name || currentUser?.username}</span>
            </div>
            <div className="pt-1.5 border-t border-border flex justify-between items-center">
              <span className="font-bold text-foreground">Status Otomatis:</span>
              <Badge variant="outline" className="text-[10px] font-bold text-orange-600 border-orange-300 dark:border-orange-800">
                PENDING
              </Badge>
            </div>
          </div>
        </div>

        {/* Info Callout */}
        <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">ℹ️</span>
          <span>Setelah dikirim, Admin Gudang akan menerima notifikasi persetujuan & menyiapkan Surat Jalan (DO).</span>
        </div>

        {/* Warning Banner for Duplicate Pending Items */}
        {conflictingItems.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Toko Anda masih memiliki permintaan yang sedang menunggu untuk barang yang sama. Pengajuan tetap diproses jika mendesak.</span>
          </div>
        )}

        {/* Request Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Catatan Tambahan (Opsional)
          </label>
          <div className="relative">
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Stok akhir pekan menipis..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <FileText className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 border-t border-border sticky bottom-0 bg-card py-2 -mx-1 px-1">
          <button
            type="submit"
            disabled={isSubmitting || activeItems.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-500/20 disabled:opacity-50 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Permintaan Stok ({formatRupiah(totalEstimatedValue)})</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
