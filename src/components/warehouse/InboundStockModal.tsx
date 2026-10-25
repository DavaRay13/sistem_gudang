import React, { useState } from 'react';
import { Item } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { ArrowDownRight, FileText, CheckCircle2 } from 'lucide-react';

interface InboundStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  preselectedItemId?: number;
}

export const InboundStockModal: React.FC<InboundStockModalProps> = ({
  isOpen,
  onClose,
  items,
  preselectedItemId,
}) => {
  const { inboundStock } = useInventory();
  const { currentUser } = useAuth();

  const activeItems = items.filter(i => !i.is_archived);
  const [itemId, setItemId] = useState<number>(preselectedItemId || (activeItems[0]?.id ?? 1));
  const [qty, setQty] = useState<number | string>(100);
  const [notes, setNotes] = useState<string>('Penerimaan Barang Masuk');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync when preselected item changes
  React.useEffect(() => {
    if (preselectedItemId && activeItems.some(i => i.id === preselectedItemId)) {
      setItemId(preselectedItemId);
    } else if (activeItems.length > 0 && !activeItems.some(i => i.id === itemId)) {
      setItemId(activeItems[0].id);
    }
  }, [preselectedItemId, activeItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const parsedQty = Number(qty);
    if (!parsedQty || parsedQty <= 0) {
      alert('Jumlah kuantiti harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await inboundStock(Number(itemId), parsedQty, notes, currentUser.id);
      onClose();
      // Reset form defaults
      setQty(100);
      setNotes('Penerimaan Barang Masuk');
    } catch {
      // Toast handles error
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = items.find(i => i.id === Number(itemId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Penerimaan Barang Masuk (Stok Baru)"
      subtitle="Tambah stok baru ke Gudang Pusat"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pilih Barang */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Pilih Barang
          </label>
          {activeItems.length === 0 ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
              Belum ada data barang. Silakan tambahkan barang terlebih dahulu.
            </div>
          ) : (
            <select
              value={itemId}
              onChange={e => setItemId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              {activeItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Kuantiti & Satuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Jumlah Barang Masuk
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={e => {
                  const val = e.target.value;
                  setQty(val === '' ? '' : Math.max(0, parseInt(val) || 0));
                }}
                onBlur={() => {
                  if (!qty || Number(qty) < 1) setQty(1);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <ArrowDownRight className="w-4 h-4 text-emerald-500 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Satuan
            </label>
            <input
              type="text"
              disabled
              value={selectedItem?.unit || 'PCS'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed"
            />
          </div>
        </div>

        {/* Catatan / Nomor Dokumen */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Nomor Dokumen / Catatan Penerimaan
          </label>
          <div className="relative">
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan barang masuk..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Ledger Alert Info */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pencatatan Otomatis: </span>
            Stok masuk ini akan otomatis tercatat ke riwayat mutasi barang tanpa risiko data hilang.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-border sticky bottom-0 bg-card py-2 -mx-1 px-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors text-center"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || activeItems.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all text-center"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Simpan & Tambah Stok</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
