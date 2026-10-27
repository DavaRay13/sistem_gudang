import React, { useState } from 'react';
import { TransferRequest, Location, Item } from '../../types';
import { Modal } from '../common/Modal';
import { WorkflowStatusLooper } from '../common/WorkflowStatusLooper';
import { 
  Copy, Check, Truck, CheckCircle2, 
  Clock, FileText
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ShipmentTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TransferRequest;
  locations: Location[];
  items?: Item[];
  onOpenHandshake?: (request: TransferRequest) => void;
  onOpenSuratJalan?: (request: TransferRequest) => void;
  isStoreStaff?: boolean;
}

export const ShipmentTrackingModal: React.FC<ShipmentTrackingModalProps> = ({
  isOpen,
  onClose,
  request,
  locations,
  onOpenHandshake,
  onOpenSuratJalan,
  isStoreStaff = false,
}) => {
  const [copied, setCopied] = useState(false);

  const fromLoc = locations.find(l => l.id === request.from_location_id);
  const toLoc = locations.find(l => l.id === request.to_location_id);

  // Extract courier info if present in request_notes
  const courierMatch = request.request_notes?.match(/\[Kurir:\s*([^|\]]+)(?:\s*\|\s*Plat:\s*([^\]]+))?\]/);
  const driverName = courierMatch ? courierMatch[1].trim() : '';
  const vehiclePlate = courierMatch && courierMatch[2] ? courierMatch[2].trim() : '';

  // Extract priority service if present
  const isExpress = request.request_notes?.toLowerCase().includes('express') || request.request_notes?.toLowerCase().includes('urgent');

  const doNumber = request.do_number || request.request_number;

  const handleCopy = () => {
    navigator.clipboard.writeText(doNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCompleted = request.status === 'COMPLETED';
  const isInTransit = request.status === 'IN_TRANSIT';
  const isApproved = request.status === 'APPROVED' || isInTransit || isCompleted;

  const totalQty = request.items?.reduce((sum, item) => sum + (item.qty_dispatched || item.qty_requested), 0) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
    >
      <div className="-mt-3 space-y-4">
        {/* Top Navigation & Title Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Detail Pengiriman</h2>
              <p className="text-[10px] text-muted-foreground">Tracking mutasi stok inter-lokasi</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenSuratJalan && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenSuratJalan(request)}
                className="h-7 text-xs gap-1 border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Surat Jalan</span>
              </Button>
            )}
          </div>
        </div>

        {/* Package ID & Status Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50/70 via-white to-orange-50/30 dark:from-orange-950/30 dark:via-card dark:to-orange-950/10 border border-orange-200/80 dark:border-orange-900/40 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                Nomor Surat Jalan (DO)
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-extrabold text-foreground tracking-tight">
                  {doNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md text-orange-600 hover:bg-orange-100/80 dark:hover:bg-orange-950 transition-colors"
                  title="Salin No DO"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <Badge
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-2xs ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isInTransit
                  ? 'bg-orange-500 text-white animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 inline-block"></span>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-orange-200/60 dark:border-orange-900/30 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Status Pengiriman</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {isCompleted 
                  ? 'Telah Diterima' 
                  : isInTransit 
                  ? 'Dalam Perjalanan Armada' 
                  : 'Menunggu Pengiriman'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Prioritas Layanan</span>
              <span className="font-bold text-foreground flex items-center gap-1">
                {isExpress ? 'Express ⚡' : 'Reguler / Standar 🚚'}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Workflow GSAP Animated Horizon */}
        <WorkflowStatusLooper
          status={request.status}
          fromName={fromLoc?.name || 'Gudang Pusat'}
          toName={toLoc?.name || 'Toko Cabang'}
          doNumber={doNumber}
          totalQty={totalQty}
        />

        {/* Armada info if available */}
        {(driverName || vehiclePlate) && (
          <div className="p-2.5 rounded-xl bg-muted/50 text-[11px] flex items-center justify-between text-muted-foreground border border-border">
            <span>Armada Pengantar:</span>
            <span className="font-semibold text-foreground">
              {driverName} {vehiclePlate && `(${vehiclePlate})`}
            </span>
          </div>
        )}

        {/* Tracking Timeline */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Riwayat Perjalanan (Tracking Timeline)
          </h3>

          <div className="space-y-3.5 pl-2 relative before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-0.5 before:bg-border">
            {/* Step 1: Request Created */}
            <div className="flex items-start gap-3 relative">
              <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Permintaan Stok Dibuat</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatDate(request.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Pemohon: {request.requested_by} • {totalQty} unit barang
                </p>
              </div>
            </div>

            {/* Step 2: Approved / Verification */}
            <div className="flex items-start gap-3 relative">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs ${
                isApproved ? 'bg-orange-500 text-white' : 'bg-muted border border-border text-muted-foreground'
              }`}>
                {isApproved ? <Check className="w-3 h-3 stroke-[3]" /> : <Clock className="w-3 h-3" />}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isApproved ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Verifikasi & Approval Admin Gudang
                  </span>
                  {request.approved_by && (
                    <span className="text-[10px] text-muted-foreground font-mono">Disetujui</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {request.approved_by ? `Disetujui oleh: ${request.approved_by}` : 'Menunggu verifikasi admin gudang'}
                </p>
              </div>
            </div>

            {/* Step 3: Dispatched (In Transit) */}
            <div className="flex items-start gap-3 relative">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs ${
                isInTransit || isCompleted ? 'bg-orange-500 text-white' : 'bg-muted border border-border text-muted-foreground'
              }`}>
                {isInTransit || isCompleted ? <Truck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isInTransit || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Barang Berangkat (In Transit)
                  </span>
                  {request.dispatched_at && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(request.dispatched_at)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {driverName ? `Dibawa kurir ${driverName}` : 'Dalam perjalanan armada ekspedisi'}
                </p>
              </div>
            </div>

            {/* Step 4: Handshake / Completed */}
            <div className="flex items-start gap-3 relative">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs ${
                isCompleted ? 'bg-emerald-500 text-white' : 'bg-muted border border-border text-muted-foreground'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    Penerimaan Selesai (Handshake)
                  </span>
                  {request.received_at && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(request.received_at)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isCompleted ? 'Stok telah masuk ke inventaris toko' : 'Menunggu konfirmasi fisik saat armada tiba di toko'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Primary Action Button */}
        <div className="pt-2">
          {isInTransit && isStoreStaff && onOpenHandshake ? (
            <Button
              className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md gap-2"
              onClick={() => {
                onClose();
                onOpenHandshake(request);
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi Terima di Toko (Handshake)</span>
            </Button>
          ) : onOpenSuratJalan ? (
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl font-bold gap-2 border-border"
              onClick={() => {
                onClose();
                onOpenSuratJalan(request);
              }}
            >
              <FileText className="w-4 h-4 text-orange-600" />
              <span>Cetak / Unduh Surat Jalan (DO)</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl font-bold"
              onClick={onClose}
            >
              Tutup
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
