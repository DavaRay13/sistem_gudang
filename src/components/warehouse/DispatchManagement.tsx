import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { TransferRequest } from '../../types';
import { StatusBadge } from '../common/Badge';
import { SuratJalanModal } from '../documents/SuratJalanModal';
import { Modal } from '../common/Modal';
import { 
  Send, Truck, Printer, Store, 
  PackageCheck, CheckCircle2, Download, User, Car
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { exportTransferRequestsToExcel } from '../../utils/exportHelpers';

export const DispatchManagement: React.FC = () => {
  const { requests, items, dispatchRequest } = useInventory();
  const { currentUser, locations, users } = useAuth();

  const [activeSuratJalan, setActiveSuratJalan] = useState<TransferRequest | null>(null);
  const [dispatchModalReq, setDispatchModalReq] = useState<TransferRequest | null>(null);
  const [driverName, setDriverName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const itemMap = new Map(items.map(i => [i.id, i]));
  const locMap = new Map(locations.map(l => [l.id, l]));

  // Ready for dispatch (APPROVED / PARTIAL)
  const readyToDispatch = requests.filter(r => r.status === 'APPROVED' || r.status === 'PARTIAL');

  // Currently In-Transit (DISPATCHED)
  const activeInTransit = requests.filter(r => r.status === 'IN_TRANSIT');

  const handleOpenDispatchModal = (req: TransferRequest) => {
    setDispatchModalReq(req);
    setDriverName('');
    setVehiclePlate('');
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !dispatchModalReq) return;

    setIsDispatching(true);
    try {
      await dispatchRequest(dispatchModalReq.id, currentUser.id, {
        driverName: driverName.trim(),
        vehiclePlate: vehiclePlate.trim(),
      });
      const reqId = dispatchModalReq.id;
      setDispatchModalReq(null);
      // Auto open Surat Jalan after successful dispatch
      const updatedReq = requests.find(r => r.id === reqId);
      if (updatedReq) {
        setActiveSuratJalan(updatedReq);
      }
    } catch {
      // Handled by toast
    } finally {
      setIsDispatching(false);
    }
  };

  const handleExportExcel = () => {
    exportTransferRequestsToExcel(
      requests,
      items,
      locations,
      users,
      currentUser?.full_name || 'Admin Gudang Pusat',
      'Laporan_Pengiriman_dan_Surat_Jalan.xlsx'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-600" />
            <span>Pengiriman Barang & Surat Jalan</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Kirim barang yang sudah disetujui dan pantau barang di jalan
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={requests.length === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm active:scale-95 disabled:opacity-50 transition-all shrink-0"
          title="Export Status Pengiriman & Surat Jalan ke Excel"
        >
          <Download className="w-4 h-4" />
          <span>Excel</span>
        </button>
      </div>

      {/* Section 1: Siap Kirim (Pending Packing & Dispatch) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Siap Dikirim ({readyToDispatch.length})</span>
          </h3>
        </div>

        {readyToDispatch.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <PackageCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">
              Tidak ada antrean barang siap kirim.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readyToDispatch.map(req => {
              const dest = locMap.get(req.to_location_id);
              const totalItems = req.items.reduce((sum, i) => sum + i.qty_approved, 0);

              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                        {req.request_number}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Store className="w-3.5 h-3.5 text-brand-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {dest?.name}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  {/* Rincian Ringkas */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Total: {totalItems} Unit ({req.items.length} Barang)
                    </span>
                    {req.items.slice(0, 3).map(item => {
                      const mItem = itemMap.get(item.item_id);
                      return (
                        <div key={item.id} className="flex justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                            {mItem?.name}
                          </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {item.qty_approved} {mItem?.unit || 'PCS'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dispatch Action */}
                  <button
                    onClick={() => handleOpenDispatchModal(req)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white dark:text-[#111111] bg-[#111111] dark:bg-white hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Barang & Terbitkan DO</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Sedang Dalam Perjalanan (In-Transit) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Sedang Dalam Pengiriman ({activeInTransit.length})</span>
          </h3>
        </div>

        {activeInTransit.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">
              Tidak ada pengiriman yang sedang di jalan saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInTransit.map(req => {
              const dest = locMap.get(req.to_location_id);
              const totalDispatched = req.items.reduce((sum, i) => sum + i.qty_dispatched, 0);

              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400 block">
                        {req.do_number}
                      </span>
                      <span className="text-xs text-slate-500">Ref: {req.request_number}</span>
                    </div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs">
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>Tujuan: {dest?.name}</span>
                      <span className="text-blue-600 dark:text-blue-400">{totalDispatched} unit di jalan</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Waktu Kirim: {formatDate(req.dispatched_at)}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveSuratJalan(req)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Lihat / Cetak Surat Jalan</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Dispatch & Identitas Pengiriman */}
      {dispatchModalReq && (
        <Modal
          isOpen={Boolean(dispatchModalReq)}
          onClose={() => setDispatchModalReq(null)}
          title="Konfirmasi Pengiriman & Terbitkan DO"
          subtitle={`Tujuan: ${locMap.get(dispatchModalReq.to_location_id)?.name} • Ref: ${dispatchModalReq.request_number}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmDispatch} className="space-y-4">
            {/* Ringkasan Barang yang Dikirim */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-[10px] tracking-wider">
                Barang Siap Muat:
              </span>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 pr-1">
                {dispatchModalReq.items.map(item => {
                  const m = itemMap.get(item.item_id);
                  return (
                    <div key={item.id} className="py-1 flex justify-between items-center text-[11px]">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {m?.name || `Item #${item.item_id}`}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {item.qty_approved} {m?.unit || 'PCS'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Identitas Supir / Kurir */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Kurir / Supir (Opsional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: Pak Joko / Supir Kantor / J&T"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* No Polisi / Resi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                No. Polisi Kendaraan / No. Resi (Opsional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: B 9123 SAA / JT12345678"
                  value={vehiclePlate}
                  onChange={e => setVehiclePlate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <Car className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Notice stok akan berkurang */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ℹ️ Stok gudang pusat akan otomatis dipotong, Surat Jalan (DO) diterbitkan, dan toko cabang akan mendapat notifikasi barang di perjalanan.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDispatchModalReq(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isDispatching}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 active:scale-95 shadow-md shadow-brand-600/20 transition-all"
              >
                <Truck className="w-4 h-4" />
                <span>{isDispatching ? 'Memproses...' : 'Kirim & Terbitkan DO'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

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
