import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { TransferRequest } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { SuratJalanModal } from '../documents/SuratJalanModal';
import { NavigationTab } from '../layout/Sidebar';
import {
  CheckCircle2, AlertTriangle,
  XCircle, Store, AlertCircle, FileText,
  Plus, Minus, Send, Printer, Truck,
  PackageCheck, Download, Info
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { exportTransferRequestsToExcel } from '../../utils/exportHelpers';

interface WarehousePipelineProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const WarehousePipeline: React.FC<WarehousePipelineProps> = ({ onNavigate: _onNavigate }) => {
  const { requests, items, inventories, authorizeRequest, dispatchRequest } = useInventory();
  const { currentUser, locations, users } = useAuth();

  const [selectedStoreFilter, setSelectedStoreFilter] = useState<number | 'ALL'>('ALL');
  const [activeRequest, setActiveRequest] = useState<TransferRequest | null>(null);
  const [modalType, setModalType] = useState<'PARTIAL' | 'REJECT' | null>(null);
  const [partialQtys, setPartialQtys] = useState<{ [itemId: number]: number | string }>({});
  const [notes, setNotes] = useState<string>('');
  const [activeSuratJalan, setActiveSuratJalan] = useState<TransferRequest | null>(null);
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);

  const itemMap = new Map(items.map(i => [i.id, i]));
  const locMap = new Map(locations.map(l => [l.id, l]));
  const userMap = new Map(users.map(u => [u.id, u]));

  const getWarehouseStock = (itemId: number) => {
    const inv = inventories.find(i => i.location_id === 0 && i.item_id === itemId);
    return inv ? inv.stock_available : 0;
  };

  const filterByStore = (list: TransferRequest[]) => {
    if (selectedStoreFilter === 'ALL') return list;
    return list.filter(r => r.to_location_id === selectedStoreFilter);
  };

  const pendingRequests = filterByStore(requests.filter(r => r.status === 'PENDING'));
  const readyToDispatch = filterByStore(requests.filter(r => r.status === 'APPROVED' || r.status === 'PARTIAL'));
  const inTransit = filterByStore(requests.filter(r => r.status === 'IN_TRANSIT'));

  const handleApproveFull = async (req: TransferRequest) => {
    if (!currentUser) return;
    for (const item of req.items) {
      const stock = getWarehouseStock(item.item_id);
      if (stock < item.qty_requested) {
        alert(`Stok gudang tidak cukup untuk "${itemMap.get(item.item_id)?.name}". Gunakan "Setujui Sebagian".`);
        return;
      }
    }
    if (confirm(`Setujui semua barang pada ${req.request_number}?`)) {
      try { await authorizeRequest(req.id, currentUser.id, 'APPROVE_FULL'); } catch { /* toast */ }
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
          return { itemId: item.item_id, qtyApproved };
        });
        for (const ai of approvedItems) {
          const stock = getWarehouseStock(ai.itemId);
          if (ai.qtyApproved > stock) {
            alert(`Kuantiti melebihi stok gudang untuk "${itemMap.get(ai.itemId)?.name}" (tersedia: ${stock} unit).`);
            return;
          }
        }
        await authorizeRequest(activeRequest.id, currentUser.id, 'APPROVE_PARTIAL', { approvedItems, rejectionNotes: notes });
      } else if (modalType === 'REJECT') {
        if (!notes.trim()) { alert('Wajib isi alasan penolakan.'); return; }
        await authorizeRequest(activeRequest.id, currentUser.id, 'REJECT', { rejectionNotes: notes });
      }
    } catch { /* toast */ }
    setModalType(null);
    setActiveRequest(null);
  };

  const handleDirectDispatch = async (req: TransferRequest) => {
    if (!currentUser) return;
    if (!confirm(`Kirim barang dan terbitkan Surat Jalan (DO) untuk ${req.request_number}?`)) {
      return;
    }
    setDispatchingId(req.id);
    try {
      await dispatchRequest(req.id, currentUser.id);
      const updated = requests.find(r => r.id === req.id);
      if (updated) {
        setActiveSuratJalan(updated);
      }
    } catch {
      /* toast */
    } finally {
      setDispatchingId(null);
    }
  };

  const handleExport = () => {
    exportTransferRequestsToExcel(requests, items, locations, users, currentUser?.full_name || 'Admin Gudang Pusat');
  };

  const storeOptions = [1, 2, 3].map(id => ({ id, name: locMap.get(id)?.name || `Toko ${id}` }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#EAEAEA] dark:border-[#26282E]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] dark:text-[#ECECED]">
            Proses Permintaan Toko
          </h1>
          <p className="text-xs text-[#787774] dark:text-[#A1A09E] mt-0.5">
            Periksa permintaan → setujui → kirim truk. Semua alur di satu halaman.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Store filter */}
          <select
            value={selectedStoreFilter}
            onChange={e => setSelectedStoreFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 rounded-lg text-xs font-medium border border-[#EAEAEA] dark:border-[#26282E] bg-white dark:bg-[#16171A] text-[#111111] dark:text-[#ECECED] focus:outline-none"
          >
            <option value="ALL">Semua Toko</option>
            {storeOptions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button
            onClick={handleExport}
            disabled={requests.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#EAEAEA] dark:border-[#26282E] bg-white dark:bg-[#16171A] text-[#111111] dark:text-[#ECECED] hover:bg-[#F7F6F3] dark:hover:bg-[#1C1E22] disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Alur proses visual: 3 tahap (Responsive Grid di mobile & desktop) */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[
          { step: 1, label: 'Masuk', fullLabel: 'Permintaan Masuk', count: pendingRequests.length, color: 'bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-800 border-amber-300 dark:from-amber-950/60 dark:to-amber-900/40 dark:text-amber-300 dark:border-amber-700/60 shadow-2xs' },
          { step: 2, label: 'Siap Kirim', fullLabel: 'Siap Dikirim', count: readyToDispatch.length, color: 'bg-gradient-to-r from-emerald-50 to-emerald-100/70 text-emerald-800 border-emerald-300 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-2xs' },
          { step: 3, label: 'Di Jalan', fullLabel: 'Dalam Perjalanan', count: inTransit.length, color: 'bg-gradient-to-r from-sky-50 to-blue-100/70 text-sky-800 border-sky-300 dark:from-sky-950/60 dark:to-blue-900/40 dark:text-sky-300 dark:border-sky-700/60 shadow-2xs' },
        ].map(s => (
          <div key={s.step} className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs font-medium ${s.color}`}>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">{s.step}</span>
              <span className="truncate hidden sm:inline">{s.fullLabel}</span>
              <span className="truncate sm:hidden text-[11px] font-semibold">{s.label}</span>
            </div>
            <span className="font-mono font-black text-sm sm:text-base mt-1 sm:mt-0 text-right">{s.count}</span>
          </div>
        ))}
      </div>

      {/* ===== TAHAP 1: PERMINTAAN BARU ===== */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#FBF3DB] dark:bg-[#332A15] border border-[#F4E3B4] dark:border-[#4D3F1E] flex items-center justify-center text-[11px] font-mono font-bold text-[#956400] dark:text-[#E8CA65] shrink-0">1</div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] dark:text-[#ECECED]">Permintaan Masuk dari Toko</h2>
            <p className="text-[11px] text-[#787774] dark:text-[#A1A09E]">Periksa stok gudang, lalu putuskan: setujui semua, setujui sebagian, atau tolak.</p>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-[#16171A] rounded-xl border border-[#EAEAEA] dark:border-[#26282E]">
            <CheckCircle2 className="w-8 h-8 text-[#346538] dark:text-[#96D99C] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#111111] dark:text-[#ECECED]">Tidak ada permintaan baru</p>
            <p className="text-[11px] text-[#787774] dark:text-[#A1A09E] mt-0.5">Semua permintaan sudah diproses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingRequests.map(req => {
              const dest = locMap.get(req.to_location_id);
              const requester = userMap.get(req.requested_by);
              const hasShortage = req.items.some(item => getWarehouseStock(item.item_id) < item.qty_requested);

              return (
                <div key={req.id} className="bg-white dark:bg-[#16171A] rounded-xl border border-[#EAEAEA] dark:border-[#26282E] overflow-hidden">
                  {/* Card Header */}
                  <div className="px-4 py-3 bg-[#FBFBFA] dark:bg-[#191A1E] border-b border-[#EAEAEA] dark:border-[#26282E] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#111111] dark:text-[#ECECED]">{req.request_number}</span>
                        <StatusBadge status={req.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#787774] dark:text-[#A1A09E] mt-0.5">
                        <Store className="w-3 h-3" />
                        <span className="font-medium text-[#111111] dark:text-[#ECECED]">{dest?.name}</span>
                        <span>·</span>
                        <span>{requester?.full_name?.split(' ')[0]}</span>
                        <span>·</span>
                        <span>{formatDate(req.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Barang yang diminta */}
                  <div className="p-4 space-y-2">
                    {req.items.map(item => {
                      const master = itemMap.get(item.item_id);
                      const stock = getWarehouseStock(item.item_id);
                      const cukup = stock >= item.qty_requested;
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#F7F6F3] dark:border-[#1C1E22] last:border-0">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-[#111111] dark:text-[#ECECED] block truncate">{master?.name}</span>
                          </div>
                          <div className="text-right shrink-0 text-xs">
                            <span className="font-bold text-[#111111] dark:text-[#ECECED]">{item.qty_requested} {master?.unit}</span>
                            <div className={`text-[10px] font-medium ${cukup ? 'text-[#346538] dark:text-[#96D99C]' : 'text-[#956400] dark:text-[#E8CA65]'}`}>
                              Gudang: {stock} {cukup ? '✓' : `(kurang ${item.qty_requested - stock})`}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {req.request_notes && (
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[#F7F6F3] dark:bg-[#191A1E] text-[11px] text-[#787774] dark:text-[#A1A09E]">
                        <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>Catatan: {req.request_notes}</span>
                      </div>
                    )}

                    {hasShortage && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#FBF3DB] dark:bg-[#332A15] border border-[#F4E3B4] dark:border-[#4D3F1E] text-[11px] text-[#956400] dark:text-[#E8CA65]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Stok gudang tidak cukup — gunakan <strong>Setujui Sebagian</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Tombol aksi */}
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openRejectModal(req)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium text-[#9F2F2D] dark:text-[#F8A4A4] bg-[#FDEBEC] dark:bg-[#381B1B] border border-[#F8D2D4] dark:border-[#522525] active:scale-[0.98] transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                    <button
                      onClick={() => openPartialModal(req)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium text-[#956400] dark:text-[#E8CA65] bg-[#FBF3DB] dark:bg-[#332A15] border border-[#F4E3B4] dark:border-[#4D3F1E] active:scale-[0.98] transition-all"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Sebagian</span>
                    </button>
                    <button
                      onClick={() => handleApproveFull(req)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-white dark:text-[#111111] bg-[#111111] dark:bg-white active:scale-[0.98] transition-all"
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
      </section>

      {/* ===== TAHAP 2: SIAP KIRIM ===== */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#EDF3EC] dark:bg-[#172B19] border border-[#D4E5D3] dark:border-[#223F25] flex items-center justify-center text-[11px] font-mono font-bold text-[#346538] dark:text-[#96D99C] shrink-0">2</div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] dark:text-[#ECECED]">Siap Dikirim</h2>
            <p className="text-[11px] text-[#787774] dark:text-[#A1A09E]">Barang sudah disetujui dan disiapkan. Cetak Surat Jalan lalu tekan Kirim Truk.</p>
          </div>
        </div>

        {readyToDispatch.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-[#16171A] rounded-xl border border-[#EAEAEA] dark:border-[#26282E]">
            <PackageCheck className="w-8 h-8 text-[#A1A09E] dark:text-[#787774] mx-auto mb-2" />
            <p className="text-xs text-[#787774] dark:text-[#A1A09E]">Tidak ada barang antre untuk dikirim.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readyToDispatch.map(req => {
              const dest = locMap.get(req.to_location_id);
              const totalQty = req.items.reduce((s, i) => s + i.qty_approved, 0);
              return (
                <div key={req.id} className="bg-white dark:bg-[#16171A] rounded-xl border border-[#D4E5D3] dark:border-[#223F25] overflow-hidden">
                  <div className="px-4 py-3 bg-[#EDF3EC] dark:bg-[#172B19] border-b border-[#D4E5D3] dark:border-[#223F25] flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#111111] dark:text-[#ECECED]">{req.request_number}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#787774] dark:text-[#A1A09E] mt-0.5">
                        <Store className="w-3 h-3" />
                        <span className="font-medium text-[#346538] dark:text-[#96D99C]">{dest?.name}</span>
                      </div>
                    </div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-xs text-[#787774] dark:text-[#A1A09E]">
                      <strong className="text-[#111111] dark:text-[#ECECED]">{totalQty} unit</strong> ({req.items.length} jenis barang)
                    </div>
                    {req.items.map(item => {
                      const master = itemMap.get(item.item_id);
                      return (
                        <div key={item.id} className="flex justify-between text-[11px]">
                          <span className="text-[#787774] dark:text-[#A1A09E] truncate max-w-[160px]">{master?.name}</span>
                          <span className="font-bold text-[#346538] dark:text-[#96D99C] font-mono">{item.qty_approved} {master?.unit}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => setActiveSuratJalan(req)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium border border-[#EAEAEA] dark:border-[#26282E] bg-white dark:bg-[#16171A] text-[#111111] dark:text-[#ECECED] hover:bg-[#F7F6F3] dark:hover:bg-[#1C1E22] active:scale-[0.98] transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Surat Jalan</span>
                    </button>
                    <button
                      disabled={dispatchingId === req.id}
                      onClick={() => handleDirectDispatch(req)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-white dark:text-[#111111] bg-[#111111] dark:bg-white active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{dispatchingId === req.id ? 'Memproses...' : 'Kirim Truk'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== TAHAP 3: DALAM PERJALANAN ===== */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#E1F3FE] dark:bg-[#142838] border border-[#C8E7FD] dark:border-[#1E3B52] flex items-center justify-center text-[11px] font-mono font-bold text-[#1F6C9F] dark:text-[#97D2FB] shrink-0">3</div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] dark:text-[#ECECED]">Dalam Perjalanan</h2>
            <p className="text-[11px] text-[#787774] dark:text-[#A1A09E]">Truk sudah berangkat. Menunggu konfirmasi penerimaan dari toko cabang.</p>
          </div>
        </div>

        {inTransit.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-[#16171A] rounded-xl border border-[#EAEAEA] dark:border-[#26282E]">
            <Truck className="w-8 h-8 text-[#A1A09E] dark:text-[#787774] mx-auto mb-2" />
            <p className="text-xs text-[#787774] dark:text-[#A1A09E]">Tidak ada pengiriman aktif saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inTransit.map(req => {
              const dest = locMap.get(req.to_location_id);
              const totalDispatched = req.items.reduce((s, i) => s + i.qty_dispatched, 0);
              return (
                <div key={req.id} className="bg-white dark:bg-[#16171A] rounded-xl border border-[#C8E7FD] dark:border-[#1E3B52] overflow-hidden">
                  <div className="px-4 py-3 bg-[#E1F3FE] dark:bg-[#142838] border-b border-[#C8E7FD] dark:border-[#1E3B52] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#1F6C9F] dark:text-[#97D2FB]">{req.do_number}</span>
                        <span className="text-[10px] text-[#787774] dark:text-[#A1A09E]">/ {req.request_number}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#787774] dark:text-[#A1A09E] mt-0.5">
                        <Truck className="w-3 h-3 text-[#1F6C9F] dark:text-[#97D2FB]" />
                        <span className="font-medium text-[#1F6C9F] dark:text-[#97D2FB]">Menuju {dest?.name}</span>
                      </div>
                    </div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="text-xs text-[#787774] dark:text-[#A1A09E]">
                      <strong className="text-[#111111] dark:text-[#ECECED]">{totalDispatched} unit</strong> dikirim · {formatDate(req.dispatched_at)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#1F6C9F] dark:text-[#97D2FB]">
                      <Info className="w-3 h-3 shrink-0" />
                      <span>Menunggu toko menekan tombol "Terima Barang"</span>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setActiveSuratJalan(req)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium border border-[#EAEAEA] dark:border-[#26282E] bg-white dark:bg-[#16171A] text-[#111111] dark:text-[#ECECED] hover:bg-[#F7F6F3] dark:hover:bg-[#1C1E22] active:scale-[0.98] transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Lihat / Cetak Surat Jalan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Setujui Sebagian / Tolak */}
      <Modal
        isOpen={modalType !== null}
        onClose={() => { setModalType(null); setActiveRequest(null); }}
        title={modalType === 'PARTIAL' ? 'Setujui Sebagian Barang' : 'Tolak Permintaan'}
        subtitle={`Dokumen: ${activeRequest?.request_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4">
          {modalType === 'PARTIAL' && activeRequest && (
            <div className="space-y-3">
              <p className="text-xs text-[#787774] dark:text-[#A1A09E]">
                Isi jumlah barang yang bisa dikirim sesuai stok gudang:
              </p>
              {activeRequest.items.map(item => {
                const master = itemMap.get(item.item_id);
                const available = getWarehouseStock(item.item_id);
                const current = partialQtys[item.item_id] !== undefined ? partialQtys[item.item_id] : Math.min(item.qty_requested, available);
                const numVal = Number(current) || 0;
                const isOver = numVal > available;

                return (
                  <div key={item.id} className="p-3 rounded-lg border border-[#EAEAEA] dark:border-[#26282E] bg-[#FBFBFA] dark:bg-[#191A1E] space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#111111] dark:text-[#ECECED]">{master?.name}</span>
                      <span className={`font-medium ${available <= 0 ? 'text-[#9F2F2D] dark:text-[#F8A4A4]' : 'text-[#346538] dark:text-[#96D99C]'}`}>
                        Stok gudang: {available} unit
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#787774] dark:text-[#A1A09E] shrink-0">Diminta: {item.qty_requested}</span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button type="button"
                          onClick={() => setPartialQtys({ ...partialQtys, [item.item_id]: Math.max(0, numVal - 1) })}
                          className="p-1.5 rounded-lg bg-[#EAEAEA] dark:bg-[#26282E] text-[#111111] dark:text-[#ECECED] hover:opacity-80 active:scale-90 transition-all"
                        ><Minus className="w-3.5 h-3.5" /></button>
                        <input
                          type="number" min="0" max={item.qty_requested}
                          value={current}
                          onChange={e => {
                            const v = e.target.value;
                            if (v === '') { setPartialQtys({ ...partialQtys, [item.item_id]: '' }); return; }
                            const n = parseInt(v);
                            if (!isNaN(n)) setPartialQtys({ ...partialQtys, [item.item_id]: Math.min(Math.max(0, n), item.qty_requested) });
                          }}
                          onBlur={() => { if (partialQtys[item.item_id] === '') setPartialQtys({ ...partialQtys, [item.item_id]: 0 }); }}
                          className={`w-20 py-1.5 text-center font-bold text-sm rounded-lg border ${isOver ? 'border-[#9F2F2D] bg-[#FDEBEC] text-[#9F2F2D] dark:border-[#F8A4A4] dark:bg-[#381B1B] dark:text-[#F8A4A4]' : 'border-[#EAEAEA] dark:border-[#26282E] bg-white dark:bg-[#111215] text-[#111111] dark:text-[#ECECED]'} focus:outline-none`}
                        />
                        <button type="button"
                          onClick={() => { if (numVal < item.qty_requested) setPartialQtys({ ...partialQtys, [item.item_id]: numVal + 1 }); }}
                          className="p-1.5 rounded-lg bg-[#EAEAEA] dark:bg-[#26282E] text-[#111111] dark:text-[#ECECED] hover:opacity-80 active:scale-90 transition-all"
                        ><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {isOver && (
                      <p className="text-[10px] text-[#9F2F2D] dark:text-[#F8A4A4]">Melebihi stok. Maksimal {available} unit.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#111111] dark:text-[#ECECED] mb-1.5">
              {modalType === 'PARTIAL' ? 'Catatan (opsional)' : 'Alasan Penolakan (wajib diisi)'}
            </label>
            <textarea
              rows={3} required={modalType === 'REJECT'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tuliskan alasan..."
              className="w-full px-3 py-2.5 rounded-lg border border-[#EAEAEA] dark:border-[#26282E] bg-white dark:bg-[#111215] text-[#111111] dark:text-[#ECECED] text-xs focus:outline-none focus:border-[#111111] dark:focus:border-white"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-border sticky bottom-0 bg-card py-2 -mx-1 px-1">
            <button
              type="button"
              onClick={() => { setModalType(null); setActiveRequest(null); }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all text-center ${
                modalType === 'REJECT'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-brand-600 hover:bg-brand-500'
              }`}
            >
              {modalType === 'PARTIAL' ? 'Simpan Persetujuan Sebagian' : 'Tolak Permintaan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Surat Jalan Modal */}
      {activeSuratJalan && (
        <SuratJalanModal
          isOpen={activeSuratJalan !== null}
          onClose={() => setActiveSuratJalan(null)}
          request={activeSuratJalan}
          locations={locations}
          items={items}
          users={users}
        />
      )}
    </div>
  );
};
