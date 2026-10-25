import React, { useState, useEffect } from 'react';
import { TransferRequest, Item } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { 
  CheckCircle2, AlertTriangle, Plus, Minus, Check,
  PackageCheck, AlertCircle, ClipboardCheck
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ReceivingHandshakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TransferRequest;
  items: Item[];
}

type CheckStatus = 'UNCHECKED' | 'MATCH' | 'DISCREPANCY';

export const ReceivingHandshakeModal: React.FC<ReceivingHandshakeModalProps> = ({
  isOpen,
  onClose,
  request,
  items,
}) => {
  const { receiveTransfer } = useInventory();
  const { currentUser } = useAuth();

  const itemMap = new Map(items.map(i => [i.id, i]));

  // State checklist per item
  const [checkStatus, setCheckStatus] = useState<{ [itemId: number]: CheckStatus }>({});
  
  // State actual received quantities & reasons
  const [receivedQtys, setReceivedQtys] = useState<{ [itemId: number]: number | string }>({});
  const [discrepancyReasons, setDiscrepancyReasons] = useState<{ [itemId: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset/sync saat modal buka
  useEffect(() => {
    if (request && request.items) {
      const initialStatus: { [itemId: number]: CheckStatus } = {};
      const initialQtys: { [itemId: number]: number | string } = {};
      request.items.forEach(item => {
        initialStatus[item.item_id] = 'UNCHECKED';
        initialQtys[item.item_id] = item.qty_dispatched;
      });
      setCheckStatus(initialStatus);
      setReceivedQtys(initialQtys);
      setDiscrepancyReasons({});
    }
  }, [request, isOpen]);

  // Hitung progres review checklist
  const totalItems = request.items.length;
  const reviewedCount = request.items.filter(item => checkStatus[item.item_id] && checkStatus[item.item_id] !== 'UNCHECKED').length;
  const isAllReviewed = reviewedCount === totalItems && totalItems > 0;

  // Cek apakah ada barang yang selisih/rusak
  const hasDiscrepancy = request.items.some(item => {
    const status = checkStatus[item.item_id];
    if (status === 'DISCREPANCY') return true;
    const raw = receivedQtys[item.item_id];
    const actual = raw === '' || raw === undefined ? item.qty_dispatched : Number(raw);
    return actual < item.qty_dispatched;
  });

  // Aksi centang cepat: Tandai 1 item Sesuai
  const handleMarkMatch = (itemId: number, dispatchedQty: number) => {
    setCheckStatus(prev => ({ ...prev, [itemId]: 'MATCH' }));
    setReceivedQtys(prev => ({ ...prev, [itemId]: dispatchedQty }));
    setDiscrepancyReasons(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  // Aksi centang: Buka mode selisih
  const handleMarkDiscrepancy = (itemId: number, dispatchedQty: number) => {
    setCheckStatus(prev => ({ ...prev, [itemId]: 'DISCREPANCY' }));
    // Jika masih sama dengan dispatched, kurangi 1 sebagai default selisih
    const current = Number(receivedQtys[itemId]);
    if (current === dispatchedQty || isNaN(current)) {
      setReceivedQtys(prev => ({ ...prev, [itemId]: Math.max(0, dispatchedQty - 1) }));
    }
  };

  // Tandai SEMUA barang sesuai dalam 1 klik
  const handleMarkAllMatch = () => {
    const newStatus: { [itemId: number]: CheckStatus } = {};
    const newQtys: { [itemId: number]: number } = {};
    request.items.forEach(i => {
      newStatus[i.item_id] = 'MATCH';
      newQtys[i.item_id] = i.qty_dispatched;
    });
    setCheckStatus(newStatus);
    setReceivedQtys(newQtys);
    setDiscrepancyReasons({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!isAllReviewed) return;

    // Validasi alasan jika ada selisih
    if (hasDiscrepancy) {
      for (const item of request.items) {
        const status = checkStatus[item.item_id];
        const raw = receivedQtys[item.item_id];
        const actual = raw === '' || raw === undefined ? item.qty_dispatched : Number(raw);
        if (status === 'DISCREPANCY' || actual < item.qty_dispatched) {
          const reason = discrepancyReasons[item.item_id];
          if (!reason || !reason.trim()) {
            alert(`Wajib mengisi alasan selisih/kerusakan untuk item.`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload = request.items.map(item => {
        const raw = receivedQtys[item.item_id];
        const qtyReceived = raw === '' || raw === undefined ? item.qty_dispatched : Number(raw);
        return {
          itemId: item.item_id,
          qtyReceived,
          discrepancyReason: discrepancyReasons[item.item_id] || '',
        };
      });

      await receiveTransfer(request.id, currentUser.id, payload);
      onClose();
    } catch {
      // Handled by toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Checklist Penerimaan Barang"
      subtitle={`DO: ${request.do_number || request.request_number} • ${totalItems} Item Kiriman`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Progress Review Bar & Bulk Action */}
        <div className="p-3.5 rounded-xl bg-card border border-border shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                isAllReviewed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}>
                {isAllReviewed ? <PackageCheck className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-foreground block truncate">
                  Progres Pemeriksaan Fisik
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {reviewedCount} dari {totalItems} item telah diperiksa
                </span>
              </div>
            </div>

            {/* Quick Button: Tandai Semua Sesuai */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllMatch}
              className="text-[11px] h-8 px-2.5 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Semua Sesuai</span>
            </Button>
          </div>

          {/* Visual Progress Line */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                isAllReviewed ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${(reviewedCount / Math.max(1, totalItems)) * 100}%` }}
            />
          </div>

          {!isAllReviewed && (
            <p className="text-[10.5px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Wajib memeriksa dan memilih status checklist di setiap barang sebelum konfirmasi.</span>
            </p>
          )}
        </div>

        {/* Item Rows - Mobile Friendly Vertical Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">
            <span>Daftar Barang Surat Jalan:</span>
            <span>Status Checklist</span>
          </div>

          <div className="space-y-2.5">
            {request.items.map((item, idx) => {
              const masterItem = itemMap.get(item.item_id);
              const currentStatus = checkStatus[item.item_id] || 'UNCHECKED';
              const currentQtyReceived = receivedQtys[item.item_id] ?? item.qty_dispatched;
              const numReceived = currentQtyReceived === '' ? 0 : Number(currentQtyReceived);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                    currentStatus === 'UNCHECKED'
                      ? 'bg-card border-border hover:border-foreground/20'
                      : currentStatus === 'MATCH'
                        ? 'bg-gradient-to-r from-emerald-50/70 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-gradient-to-r from-rose-50/70 to-rose-100/40 dark:from-rose-950/40 dark:to-rose-900/20 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {/* Top Item Summary */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-foreground block truncate">
                          {idx + 1}. {masterItem?.name || `Barang #${item.item_id}`}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({masterItem?.sku || 'SKU'})
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Dikirim Gudang: <strong className="text-foreground font-mono font-bold">{item.qty_dispatched}</strong> {masterItem?.unit}
                      </span>
                    </div>

                    {/* Status Pill Indicator */}
                    <div className="shrink-0">
                      {currentStatus === 'UNCHECKED' && (
                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
                          Belum Dicek
                        </Badge>
                      )}
                      {currentStatus === 'MATCH' && (
                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs">
                          <Check className="w-3 h-3 mr-1" /> Sesuai
                        </Badge>
                      )}
                      {currentStatus === 'DISCREPANCY' && (
                        <Badge variant="outline" className="text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 shadow-2xs">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Ada Selisih
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Checklist Action Buttons - Thumb Target 44px+ */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/70">
                    <button
                      type="button"
                      onClick={() => handleMarkMatch(item.item_id, item.qty_dispatched)}
                      className={`h-11 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                        currentStatus === 'MATCH'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-muted/70 text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 border border-border'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sesuai ({item.qty_dispatched})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkDiscrepancy(item.item_id, item.qty_dispatched)}
                      className={`h-11 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                        currentStatus === 'DISCREPANCY'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-muted/70 text-foreground hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 border border-border'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Selisih / Rusak</span>
                    </button>
                  </div>

                  {/* Discrepancy Detail Stepper & Reason Editor */}
                  {currentStatus === 'DISCREPANCY' && (
                    <div className="p-3 rounded-lg bg-card border border-rose-300 dark:border-rose-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                          Jumlah Fisik Baik Diterima:
                        </span>
                        
                        {/* Mobile Stepper Counter */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReceivedQtys({
                              ...receivedQtys,
                              [item.item_id]: Math.max(0, (Number(currentQtyReceived) || 0) - 1),
                            })}
                            className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center font-bold active:scale-95 border border-border"
                            aria-label="Kurang 1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            max={item.qty_dispatched}
                            value={currentQtyReceived}
                            onChange={e => {
                              const raw = e.target.value;
                              if (raw === '') {
                                setReceivedQtys({ ...receivedQtys, [item.item_id]: '' });
                                return;
                              }
                              const val = parseInt(raw) || 0;
                              setReceivedQtys({
                                ...receivedQtys,
                                [item.item_id]: Math.min(Math.max(0, val), item.qty_dispatched),
                              });
                            }}
                            onBlur={() => {
                              if (receivedQtys[item.item_id] === '') {
                                setReceivedQtys({ ...receivedQtys, [item.item_id]: 0 });
                              }
                            }}
                            className="w-16 h-9 py-1 text-center font-bold font-mono text-sm rounded-lg border border-border bg-background text-foreground"
                          />

                          <button
                            type="button"
                            onClick={() => setReceivedQtys({
                              ...receivedQtys,
                              [item.item_id]: Math.min(item.qty_dispatched, (Number(currentQtyReceived) || 0) + 1),
                            })}
                            className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center font-bold active:scale-95 border border-border"
                            aria-label="Tambah 1"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info Selisih */}
                      <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                        Selisih: <strong>{item.qty_dispatched - numReceived}</strong> {masterItem?.unit} (tidak diterima / rusak).
                      </div>

                      {/* Quick Reason Chips */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Pilih / Ketik Keterangan Selisih:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Pecah / Rusak di Jalan', 'Kurang Kirim dari Gudang', 'Salah Varian / Item', 'Kemasan Cacat Fisik'].map(reason => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => setDiscrepancyReasons({
                                ...discrepancyReasons,
                                [item.item_id]: reason,
                              })}
                              className={`px-2.5 py-1 rounded-md text-[10.5px] font-medium border transition-colors ${
                                discrepancyReasons[item.item_id] === reason
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-muted text-foreground border-border hover:bg-muted/80'
                              }`}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          required
                          placeholder="Atau tulis catatan tambahan di sini..."
                          value={discrepancyReasons[item.item_id] || ''}
                          onChange={e => setDiscrepancyReasons({
                            ...discrepancyReasons,
                            [item.item_id]: e.target.value,
                          })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons - Mobile Sticky-Friendly */}
        <div className="pt-3 border-t border-border space-y-2 sticky bottom-0 bg-card py-2">
          <Button
            type="submit"
            disabled={isSubmitting || !isAllReviewed}
            className={`w-full h-12 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md active:scale-[0.99] transition-all ${
              !isAllReviewed
                ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                : hasDiscrepancy
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
            }`}
          >
            {isSubmitting ? (
              <span>Menyimpan ke Ledger...</span>
            ) : !isAllReviewed ? (
              <span>Checklist Semua Barang Dulu ({reviewedCount}/{totalItems})</span>
            ) : hasDiscrepancy ? (
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Konfirmasi Penerimaan (Dengan Selisih / Kerusakan)</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Penerimaan (100% Sesuai)</span>
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full h-9 text-xs text-muted-foreground"
          >
            Batal / Lanjutkan Nanti
          </Button>
        </div>
      </form>
    </Modal>
  );
};
