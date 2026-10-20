import React, { useRef, useState } from 'react';
import { TransferRequest, Location, Item, User } from '../../types';
import { Modal } from '../common/Modal';
import { PackageCheck, ShieldCheck, Share2, Loader2, Download } from 'lucide-react';
import { formatDate, formatRupiah } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SuratJalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TransferRequest;
  locations: Location[];
  items: Item[];
  users: User[];
}

export const SuratJalanModal: React.FC<SuratJalanModalProps> = ({
  isOpen,
  onClose,
  request,
  locations,
  items,
  users,
}) => {
  const fromLoc = locations.find(l => l.id === request.from_location_id);
  const toLoc = locations.find(l => l.id === request.to_location_id);
  const requester = users.find(u => u.id === request.requested_by);
  const approver = users.find(u => u.id === request.approved_by);

  const itemMap = new Map(items.map(i => [i.id, i]));
  const printRef = useRef<HTMLDivElement>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const generatePdfBlob = async (): Promise<Blob> => {
    const el = printRef.current;
    if (!el) throw new Error('Element tidak ditemukan');

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let y = 0;
    while (y < imgHeight) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -y, imgWidth, imgHeight);
      y += pageHeight;
    }

    return pdf.output('blob');
  };

  const handleDownloadPdf = async () => {
    setLoadingPdf(true);
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${request.do_number || request.request_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleShareWA = async () => {
    setLoadingPdf(true);
    try {
      const blob = await generatePdfBlob();
      const filename = `${request.do_number || request.request_number}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Share API — Android Chrome & iOS Safari 15+
        await navigator.share({
          title: `Surat Jalan ${request.do_number || request.request_number}`,
          text: `Surat Jalan untuk ${toLoc?.name || 'Toko'}`,
          files: [file],
        });
      } else {
        // Fallback: download PDF dulu, lalu buka WA
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        // Buka WA web setelah download
        const waMsg = encodeURIComponent(`Surat Jalan ${request.do_number || request.request_number} untuk ${toLoc?.name || 'Toko'} sudah diunduh, silakan lampirkan file PDF.`);
        setTimeout(() => window.open(`https://wa.me/?text=${waMsg}`, '_blank'), 800);
      }
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Surat Jalan / Delivery Order: ${request.do_number || 'DO-DRAFT'}`}
      subtitle={`Referensi Dokumen: ${request.request_number}`}
      maxWidth="4xl"
    >
      <div className="space-y-6 print:space-y-4">
        {/* Printable Area */}
        <div ref={printRef} id="printable-surat-jalan" className="p-3 sm:p-8 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 overflow-hidden">
          
          {/* Header Surat Jalan */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                  SG
                </div>
                <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-900 break-words">
                  SISTEM GUDANG LOGISTIK & DISTRIBUSI
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-sm">
                Hub-and-Spoke Central Warehouse Logistics Network. 
                Sistem Terpadu Pengiriman Barang Antar Cabang.
              </p>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 font-extrabold text-sm rounded border border-slate-300">
                SURAT JALAN RESMI
              </span>
              <div className="mt-2 text-xs font-mono">
                <div className="font-bold text-slate-900 text-sm">
                  {request.do_number || 'DO-PENDING'}
                </div>
                <div className="text-slate-500">
                  Ref: {request.request_number}
                </div>
                <div className="text-slate-500">
                  Tgl Kirim: {formatDate(request.dispatched_at || new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>

          {/* Pengirim & Penerima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 my-4 sm:my-6 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                PENGIRIM (HUB ASAL)
              </span>
              <p className="font-bold text-sm text-slate-900">{fromLoc?.name || 'Gudang Pusat'}</p>
              <p className="text-slate-600 mt-0.5">{fromLoc?.address || 'Kawasan Gudang Terpadu'}</p>
              <p className="text-slate-500 mt-1">Petugas Otorisasi: <span className="font-semibold text-slate-800">{approver?.full_name || 'Admin Gudang'}</span></p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                PENERIMA (CABANG TUJUAN)
              </span>
              <p className="font-bold text-sm text-slate-900">{toLoc?.name || 'Toko Cabang'}</p>
              <p className="text-slate-600 mt-0.5">{toLoc?.address || 'Alamat Toko'}</p>
              <p className="text-slate-500 mt-1">Pemohon: <span className="font-semibold text-slate-800">{requester?.full_name || 'Staf Toko'}</span></p>
            </div>
          </div>

          {/* Tabel Rincian Barang */}
          <div className="overflow-x-auto my-4 sm:my-6 border border-slate-300 rounded-lg">
            <table className="min-w-[600px] w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[11px] border-b border-slate-300">
                <tr>
                  <th className="px-3 py-2.5 border-r border-slate-300 w-10 text-center">No</th>
                  <th className="px-3 py-2.5 border-r border-slate-300">SKU</th>
                  <th className="px-3 py-2.5 border-r border-slate-300">Nama Barang / Deskripsi</th>
                  <th className="px-3 py-2.5 border-r border-slate-300 text-center">Satuan</th>
                  <th className="px-3 py-2.5 border-r border-slate-300 text-right">Harga Satuan</th>
                  <th className="px-3 py-2.5 border-r border-slate-300 text-right">Qty Kirim (DO)</th>
                  <th className="px-3 py-2.5 text-right font-black bg-slate-200/80">Total Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {request.items.map((item, idx) => {
                  const masterItem = itemMap.get(item.item_id);
                  const qty = item.qty_dispatched || item.qty_approved;
                  const price = masterItem?.price || 0;
                  const total = qty * price;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 border-r border-slate-300 text-center font-medium">{idx + 1}</td>
                      <td className="px-3 py-2 border-r border-slate-300 font-mono font-semibold">{masterItem?.sku || '-'}</td>
                      <td className="px-3 py-2 border-r border-slate-300 font-medium">
                        {masterItem?.name || `Item ID #${item.item_id}`}
                        <span className="block text-[10px] text-slate-500">{masterItem?.category}</span>
                      </td>
                      <td className="px-3 py-2 border-r border-slate-300 text-center uppercase">{masterItem?.unit || 'PCS'}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-right font-mono">{formatRupiah(price)}</td>
                      <td className="px-3 py-2 border-r border-slate-300 text-right font-bold text-slate-900 bg-slate-50">
                        {qty}
                      </td>
                      <td className="px-3 py-2 text-right font-black text-slate-900 bg-slate-100/50">
                        {formatRupiah(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Catatan Khusus */}
          {request.request_notes && (
            <div className="mb-6 p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs">
              <span className="font-bold text-amber-900">Catatan Permintaan Toko: </span>
              <span className="text-amber-800">{request.request_notes}</span>
            </div>
          )}

          {/* Area Tanda Tangan (Handshake Signatures) */}
          <div className="grid grid-cols-3 gap-4 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
            <div>
              <p className="font-semibold text-slate-700">Petugas Gudang (Pengirim)</p>
              <div className="h-20 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                ( {approver?.full_name || 'Admin Gudang'} )
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">Driver / Ekspedisi</p>
              <div className="h-20 flex items-center justify-center">
                <PackageCheck className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                ( ..................................... )
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">Penerima (Staf Toko)</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 italic">Verifikasi fisik saat tiba</span>
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                ( {requester?.full_name || 'Staf Toko Cabang'} )
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Dokumen ini dicetak otomatis oleh Sistem Manajemen Pergudangan & Distribusi (Hub-and-Spoke). Sah tanpa materai jika ditandatangani.
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            {loadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Unduh PDF</span>
          </button>

          <button
            onClick={handleShareWA}
            disabled={loadingPdf}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 shadow-md transition-all active:scale-[0.98]"
          >
            {loadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>Kirim ke WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
