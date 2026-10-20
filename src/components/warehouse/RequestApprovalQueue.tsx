import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { TransferRequest } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { 
  ClipboardList, CheckCircle2, AlertTriangle, 
  XCircle, Store, 
  AlertCircle, FileText, Plus, Minus, Download
} from 'lucide-react';
import { exportTransferRequestsToExcel } from '../../utils/exportHelpers';

export const RequestApprovalQueue: React.FC = () => {
  const { requests, items, inventories, authorizeRequest } = useInventory();
  const { currentUser, locations, users } = useAuth();

  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | 'ALL'>('ALL');
  
  // Action Modals State
  const [activeRequest, setActiveRequest] = useState<TransferRequest | null>(null);
  const [modalType, setModalType] = useState<'PARTIAL' | 'REJECT' | null>(null);
  const [partialQtys, setPartialQtys] = useState<{ [itemId: number]: number | string }>({});
  const [notes, setNotes] = useState<string>('');

  const itemMap = new Map(items.map(i => [i.id, i]));
  const locMap = new Map(locations.map(l => [l.id, l]));
  const userMap = new Map(users.map(u => [u.id, u]));

  // Gudang Pusat available stock helper
  const getWarehouseStock = (itemId: number) => {
    const inv = inventories.find(i => i.location_id === 0 && i.item_id === itemId);
    return inv ? inv.stock_available : 0;
  };

  const pendingRequests = requests.filter(r => {
    if (r.status !== 'PENDING') return false;
    if (selectedStoreFilter !== 'ALL' && r.to_location_id !== selectedStoreFilter) return false;
    return true;
  });

  const handleApproveFull = async (req: TransferRequest) => {
    if (!currentUser) return;
    
    // Validate if warehouse has enough stock
    for (const item of req.items) {
      const stock = getWarehouseStock(item.item_id);
      if (stock < item.qty_requested) {
        alert(`Stok di gudang tidak mencukupi. Silakan gunakan opsi Setujui Sebagian.`);
        return;
      }
    }

    if (confirm(`Setujui seluruh permintaan barang ${req.request_number}? Stok gudang akan disiapkan untuk dikirim.`)) {
      try {
        await authorizeRequest(req.id, currentUser.id, 'APPROVE_FULL');
      } catch {
        // Handled by toast
      }
    }
  };

  const openPartialModal = (req: TransferRequest) => {
    setActiveRequest(req);
    const initial: { [itemId: number]: number | string } = {};
    req.items.forEach(item => {
      const available = getWarehouseStock(item.item_id);
      initial[item.item_id] = Math.min(item.qty_requested, available);
    });
    setPartialQtys(initial);
    setNotes('Stok dialokasikan sebagian sesuai ketersediaan fisik.');
    setModalType('PARTIAL');
  };

  const openRejectModal = (req: TransferRequest) => {
    setActiveRequest(req);
    setNotes('Stok gudang pusat sedang kosong / tidak mencukupi.');
    setModalType('REJECT');
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest || !currentUser) return;

    try {
      if (modalType === 'PARTIAL') {
        const approvedItems = activeRequest.items.map(item => {
          const raw = partialQtys[item.item_id];
          const available = getWarehouseStock(item.item_id);
          const defaultVal = Math.min(item.qty_requested, Math.max(0, available));
          const qtyApproved = raw === '' || raw === undefined ? defaultVal : Math.max(0, Number(raw) || 0);
          return {
            itemId: item.item_id,
            qtyApproved,
          };
        });

        // Validasi ketersediaan stok fisik gudang
        for (const ai of approvedItems) {
          const stock = getWarehouseStock(ai.itemId);
          const master = itemMap.get(ai.itemId);
          if (ai.qtyApproved > stock) {
            alert(`Kuantiti disetujui untuk "${master?.name || 'Barang'}" (${ai.qtyApproved} unit) melebihi stok fisik di Gudang Pusat (${stock} unit).\n\nSilakan sesuaikan jumlah atau lakukan Tambah Stok (Inbound) terlebih dahulu.`);
            return;
          }
        }

        await authorizeRequest(activeRequest.id, currentUser.id, 'APPROVE_PARTIAL', {
          approvedItems,
          rejectionNotes: notes,
        });
      } else if (modalType === 'REJECT') {
        if (!notes.trim()) {
          alert('Wajib menyertakan alasan penolakan.');
          return;
        }
        await authorizeRequest(activeRequest.id, currentUser.id, 'REJECT', {
          rejectionNotes: notes,
        });
      }
    } catch {
      // Handled by toast
    }

    setModalType(null);
    setActiveRequest(null);
  };

  const handleExportExcel = () => {
    exportTransferRequestsToExcel(
      requests,
      items,
      locations,
      users,
      currentUser?.full_name || 'Admin Gudang Pusat'
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-600" />
            <span>Persetujuan Permintaan Stok</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            {pendingRequests.length} permintaan stok dari toko cabang menunggu keputusan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Store Selector */}
          <select
            value={selectedStoreFilter}
            onChange={e => setSelectedStoreFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">Semua Cabang Toko</option>
            <option value={1}>Toko 1 (Cabang Barat)</option>
            <option value={2}>Toko 2 (Cabang Selatan)</option>
            <option value={3}>Toko 3 (Cabang Timur)</option>
          </select>

          <button
            onClick={handleExportExcel}
            disabled={requests.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm active:scale-95 disabled:opacity-50 transition-all shrink-0"
            title="Export Rekap Permintaan Toko ke Excel"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* List Requests */}
      {pendingRequests.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak Ada Permintaan Menunggu
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Semua permintaan barang dari toko sudah diproses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingRequests.map(req => {
            const destinationStore = locMap.get(req.to_location_id);
            const requester = userMap.get(req.requested_by);

            let hasShortage = false;
            req.items.forEach(item => {
              const stock = getWarehouseStock(item.item_id);
              if (stock < item.qty_requested) hasShortage = true;
            });

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Header Card */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {req.request_number}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {destinationStore?.name}
                      </span>
                      <span>•</span>
                      <span>{requester?.full_name?.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Items in Request */}
                <div className="p-4 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Daftar Permintaan & Komparasi Stok:
                  </span>

                  <div className="space-y-2">
                    {req.items.map(item => {
                      const masterItem = itemMap.get(item.item_id);
                      const warehouseStock = getWarehouseStock(item.item_id);
                      const isEnough = warehouseStock >= item.qty_requested;

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {masterItem?.name}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-bold text-slate-900 dark:text-white">
                              Minta: <span className="text-sm font-black">{item.qty_requested}</span> {masterItem?.unit || 'PCS'}
                            </div>
                            <div className={`text-[10px] font-semibold ${isEnough ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              Gudang: {warehouseStock} {isEnough ? '(Cukup)' : `(Kurang ${item.qty_requested - warehouseStock})`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {req.request_notes && (
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>Catatan: {req.request_notes}</span>
                    </div>
                  )}

                  {hasShortage && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Stok gudang tidak cukup. Gunakan <strong>Setujui Sebagian</strong>.</span>
                    </div>
                  )}
                </div>

                {/* Minimalist Action Buttons */}
                <div className="p-3 bg-[#FBFBFA] dark:bg-[#191A1E] border-t border-[#EAEAEA] dark:border-[#26282E] grid grid-cols-3 gap-2">
                  <button
                    onClick={() => openRejectModal(req)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#9F2F2D] dark:text-[#F8A4A4] bg-[#FDEBEC] dark:bg-[#381B1B] hover:opacity-90 border border-[#F8D2D4] dark:border-[#522525] active:scale-[0.98] transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>

                  <button
                    onClick={() => openPartialModal(req)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#956400] dark:text-[#E8CA65] bg-[#FBF3DB] dark:bg-[#332A15] hover:opacity-90 border border-[#F4E3B4] dark:border-[#4D3F1E] active:scale-[0.98] transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Sebagian</span>
                  </button>

                  <button
                    onClick={() => handleApproveFull(req)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white dark:text-[#111111] bg-[#111111] dark:bg-white hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Setujui</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Otorisasi (Partial / Reject) */}
      <Modal
        isOpen={modalType !== null}
        onClose={() => {
          setModalType(null);
          setActiveRequest(null);
        }}
        title={modalType === 'PARTIAL' ? 'Setujui Sebagian Barang' : 'Tolak Permintaan Barang'}
        subtitle={`Dokumen: ${activeRequest?.request_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          {modalType === 'PARTIAL' && activeRequest && (
            <div className="space-y-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Sesuaikan kuantiti yang disetujui sesuai ketersediaan stok fisik gudang:
              </span>

              <div className="space-y-2">
                {activeRequest.items.map(item => {
                  const masterItem = itemMap.get(item.item_id);
                  const available = getWarehouseStock(item.item_id);
                  const currentApproved = partialQtys[item.item_id] !== undefined
                    ? partialQtys[item.item_id]
                    : Math.min(item.qty_requested, Math.max(0, available));
                  const numApproved = Number(currentApproved) || 0;
                  const isZeroStock = available <= 0;
                  const isOverStock = numApproved > available;

                  return (
                    <div key={item.id} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">
                            {masterItem?.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Diminta Toko: <strong className="font-bold text-slate-800 dark:text-slate-200">{item.qty_requested}</strong>
                          </span>
                          <span className={`text-[11px] font-bold ${isZeroStock ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            Stok Gudang: {available} unit
                          </span>
                        </div>
                      </div>

                      {/* Touch Stepper [-] [qty] [+] */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Kuantiti Disetujui:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPartialQtys({
                              ...partialQtys,
                              [item.item_id]: Math.max(0, numApproved - 1),
                            })}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-90 transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            max={item.qty_requested}
                            value={currentApproved}
                            onChange={e => {
                              const raw = e.target.value;
                              if (raw === '') {
                                setPartialQtys({
                                  ...partialQtys,
                                  [item.item_id]: '',
                                });
                                return;
                              }
                              const val = parseInt(raw);
                              if (isNaN(val)) return;
                              // Izinkan user mengetik angka sampai batas permintaan toko
                              setPartialQtys({
                                ...partialQtys,
                                [item.item_id]: Math.min(Math.max(0, val), item.qty_requested),
                              });
                            }}
                            onBlur={() => {
                              if (partialQtys[item.item_id] === '') {
                                setPartialQtys({
                                  ...partialQtys,
                                  [item.item_id]: 0,
                                });
                              }
                            }}
                            className={`w-20 py-1.5 text-center font-black text-sm rounded-lg border ${
                              isOverStock 
                                ? 'border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' 
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                            } focus:ring-2 focus:ring-brand-500 focus:outline-none`}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = numApproved + 1;
                              if (nextVal <= item.qty_requested) {
                                setPartialQtys({
                                  ...partialQtys,
                                  [item.item_id]: nextVal,
                                });
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-90 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Notifikasi Ketersediaan Stok */}
                      {isZeroStock && (
                        <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                          <span>
                            Stok Gudang Pusat masih <strong>0 (Kosong)</strong>. Harap lakukan <strong>Stok Masuk (Inbound)</strong> terlebih dahulu di menu <em>Daftar Barang</em> sebelum menyetujui pengiriman.
                          </span>
                        </div>
                      )}
                      {!isZeroStock && isOverStock && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Melebihi stok gudang (Tersedia: {available} unit). Maksimal disetujui {available}.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              {modalType === 'PARTIAL' ? 'Catatan / Alasan Penyesuaian' : 'Alasan Penolakan (Wajib)'}
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tuliskan alasan jelas..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModalType(null);
                setActiveRequest(null);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 ${
                modalType === 'PARTIAL'
                  ? 'bg-purple-600 hover:bg-purple-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {modalType === 'PARTIAL' ? 'Konfirmasi Parsial' : 'Konfirmasi Tolak'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
