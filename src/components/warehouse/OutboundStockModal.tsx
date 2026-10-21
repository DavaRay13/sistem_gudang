import React, { useState } from 'react';
import { Item, TransactionType } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ArrowUpRight, FileText, AlertTriangle, Minus, Plus } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface OutboundStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  preselectedItemId?: number;
}

const REASONS: Array<{ type: TransactionType; label: string; description: string }> = [
  {
    type: 'DAMAGE_LOSS',
    label: 'Rusak / Pecah / Kadaluarsa',
    description: 'Barang cacat fisik, rusak di rak, atau tidak layak edar',
  },
  {
    type: 'MANUAL_ADJUSTMENT',
    label: 'Selisih Hitung / Hilang (Opname)',
    description: 'Hasil stock opname fisik lebih sedikit dari sistem',
  },
  {
    type: 'DAMAGE_LOSS',
    label: 'Retur ke Vendor / Pabrik',
    description: 'Pengembalian barang reject ke supplier',
  },
  {
    type: 'MANUAL_ADJUSTMENT',
    label: 'Penjualan Langsung / Sampel',
    description: 'Barang keluar langsung tanpa melalui transfer toko',
  },
];

export const OutboundStockModal: React.FC<OutboundStockModalProps> = ({
  isOpen,
  onClose,
  items,
  preselectedItemId,
}) => {
  const { inventories, outboundStock } = useInventory();
  const { currentUser } = useAuth();

  const [itemId, setItemId] = useState<number>(preselectedItemId || (items[0]?.id ?? 1));
  const [selectedReasonIdx, setSelectedReasonIdx] = useState<number>(0);
  const [qty, setQty] = useState<number | string>(5);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync when preselected item changes
  React.useEffect(() => {
    if (preselectedItemId) {
      setItemId(preselectedItemId);
    } else if (items.length > 0 && !items.some(i => i.id === itemId)) {
      setItemId(items[0].id);
    }
  }, [preselectedItemId, items]);

  const selectedItem = items.find(i => i.id === Number(itemId));
  const hubInv = inventories.find(inv => inv.location_id === 0 && inv.item_id === Number(itemId));
  const availableStock = hubInv?.stock_available || 0;

  const currentReason = REASONS[selectedReasonIdx];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const parsedQty = Number(qty);
    if (!parsedQty || parsedQty <= 0) {
      alert('Jumlah kuantiti barang keluar harus lebih dari 0.');
      return;
    }

    if (parsedQty > availableStock) {
      alert(`Jumlah barang keluar (${parsedQty}) melebihi stok yang tersedia di Gudang Pusat (${availableStock}).`);
      return;
    }

    const fullNotes = `[${currentReason.label}] ${notes.trim() || 'Pengeluaran stok'}`;

    setIsSubmitting(true);
    try {
      await outboundStock(
        Number(itemId),
        parsedQty,
        currentReason.type,
        fullNotes,
        currentUser.id
      );
      onClose();
      // Reset form
      setQty(5);
      setNotes('');
    } catch {
      // Toast handles error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengeluaran Stok Gudang Pusat"
      subtitle="Catat pemotongan stok untuk barang rusak, retur vendor, atau selisih opname"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Pilih Alasan Pengeluaran */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            1. Alasan Pengeluaran Stok
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {REASONS.map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedReasonIdx(idx)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  selectedReasonIdx === idx
                    ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold">{r.label}</span>
                  {selectedReasonIdx === idx && (
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {r.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Pilih Barang */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            2. Pilih Barang
          </label>
          {items.length === 0 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
              Belum ada data barang di sistem.
            </div>
          ) : (
            <select
              value={itemId}
              onChange={e => setItemId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              {items.map(item => {
                const inv = inventories.find(i => i.location_id === 0 && i.item_id === item.id);
                const stock = inv?.stock_available || 0;
                return (
                  <option key={item.id} value={item.id}>
                    {item.name} — Sisa: {formatNumber(stock)} {item.unit}
                  </option>
                );
              })}
            </select>
          )}

          {/* Sisa stok badge info */}
          <div className="flex items-center justify-between mt-1.5 text-xs">
            <span className="text-[11px] text-slate-500">Stok siap potong di Gudang:</span>
            <span className={`font-mono font-bold text-xs ${
              availableStock > 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatNumber(availableStock)} {selectedItem?.unit || 'unit'}
            </span>
          </div>
        </div>

        {/* 3. Jumlah Kuantiti & Quick Buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              3. Jumlah yang Dikeluarkan
            </label>
            <div className="flex items-center gap-1">
              {[5, 10, 20].map(step => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setQty(Math.min(availableStock, (Number(qty) || 0) + step))}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 active:scale-95"
                >
                  +{step}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQty(availableStock)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200 active:scale-95"
              >
                Semua
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, (Number(qty) || 0) - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-90 font-bold shrink-0"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min="1"
              max={availableStock}
              required
              value={qty}
              onChange={e => {
                const val = e.target.value;
                setQty(val === '' ? '' : Math.max(0, parseInt(val) || 0));
              }}
              onBlur={() => {
                if (!qty || Number(qty) < 1) setQty(1);
                if (Number(qty) > availableStock) setQty(availableStock);
              }}
              className="flex-1 py-2 text-center font-black text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <button
              type="button"
              onClick={() => setQty(Math.min(availableStock, (Number(qty) || 0) + 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-90 font-bold shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {Number(qty) > availableStock && (
            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Jumlah melebihi stok yang tersedia di gudang!</span>
            </p>
          )}
        </div>

        {/* 4. Keterangan / Catatan Tambahan */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            4. Keterangan / Alasan Rinci
          </label>
          <div className="relative">
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Kemasan sobek saat bongkar muat kemarin / Kadaluarsa batch #04..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSubmitting || availableStock <= 0 || Number(qty) > availableStock}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 active:scale-95 shadow-md shadow-rose-600/20 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{isSubmitting ? 'Memproses...' : 'Potong Stok Sekarang'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
