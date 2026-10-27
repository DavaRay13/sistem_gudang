import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { TransferRequestStatus } from '../../types';
import { 
  Truck, CheckCircle2, Clock, 
  MapPin, ShieldAlert, Package, 
  Boxes, ArrowRight
} from 'lucide-react';
import { Badge } from '../ui/badge';

interface WorkflowStatusLooperProps {
  status: TransferRequestStatus;
  fromName?: string;
  toName?: string;
  doNumber?: string;
  totalQty?: number;
  className?: string;
  compact?: boolean;
}

export const WorkflowStatusLooper: React.FC<WorkflowStatusLooperProps> = ({
  status,
  fromName = 'Gudang Pusat',
  toName = 'Toko Cabang',
  doNumber,
  totalQty,
  className = '',
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const pathDashRef = useRef<SVGPathElement>(null);
  const originPulseRef = useRef<HTMLDivElement>(null);
  const destPulseRef = useRef<HTMLDivElement>(null);
  const packageFloatRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 1. In-Transit Truck Rolling & Dash Animation
      if (status === 'IN_TRANSIT') {
        // Truck gentle road suspension bounce
        gsap.to(truckRef.current, {
          y: -3,
          duration: 0.45,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        });

        // Truck horizontal forward-gliding patrol loop
        gsap.to(truckRef.current, {
          x: '+=14',
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // Animated SVG running road dash loop
        if (pathDashRef.current) {
          gsap.to(pathDashRef.current, {
            strokeDashoffset: -40,
            duration: 1.2,
            repeat: -1,
            ease: 'none',
          });
        }

        // Destination radar ping
        if (destPulseRef.current) {
          gsap.fromTo(
            destPulseRef.current,
            { scale: 0.8, opacity: 0.8 },
            { scale: 2.2, opacity: 0, duration: 1.5, repeat: -1, ease: 'power2.out' }
          );
        }
      }

      // 2. Pending Request Radar Pulse Animation
      if (status === 'PENDING') {
        if (originPulseRef.current) {
          gsap.fromTo(
            originPulseRef.current,
            { scale: 0.8, opacity: 0.9 },
            { scale: 2.2, opacity: 0, duration: 1.8, repeat: -1, ease: 'power2.out' }
          );
        }

        if (packageFloatRef.current) {
          gsap.to(packageFloatRef.current, {
            y: -5,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }
      }

      // 3. Approved / Reserved Preparation Pulse
      if (status === 'APPROVED' || status === 'PARTIAL') {
        if (packageFloatRef.current) {
          gsap.to(packageFloatRef.current, {
            scale: 1.08,
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: 'power1.inOut',
          });
        }
      }
    },
    { scope: containerRef, dependencies: [status] }
  );

  // Status-dependent labels & styles
  const isPending = status === 'PENDING';
  const isApproved = status === 'APPROVED' || status === 'PARTIAL';
  const isInTransit = status === 'IN_TRANSIT';
  const isCompleted = status === 'COMPLETED';
  const isRejected = status === 'REJECTED';

  const statusNarrative = isPending
    ? 'Menunggu Otorisasi Admin Gudang'
    : isApproved
    ? 'Disetujui • DO Disiapkan di Gudang'
    : isInTransit
    ? 'Armada Sedang Melaju Menuju Toko'
    : isCompleted
    ? 'Barang Berhasil Diterima Toko (Selesai)'
    : isRejected
    ? 'Permintaan Ditolak'
    : 'Verifikasi Penerimaan';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        isInTransit
          ? 'bg-gradient-to-br from-orange-500/[0.07] via-card to-amber-500/[0.04] border-orange-500/30 dark:border-orange-500/20'
          : isCompleted
          ? 'bg-gradient-to-br from-emerald-500/[0.06] via-card to-teal-500/[0.03] border-emerald-500/30 dark:border-emerald-500/20'
          : isRejected
          ? 'bg-destructive/[0.05] border-destructive/20'
          : 'bg-card border-border'
      } ${compact ? 'p-3' : 'p-4 sm:p-5'} ${className}`}
    >
      {/* Top Meta Line: DO & Status Capsule */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0 animate-ping inline-block bg-orange-500" />
          <span className="text-[11px] font-mono font-bold tracking-tight text-foreground truncate">
            {doNumber ? doNumber : 'Alur Distribusi Mutasi'}
          </span>
          {totalQty !== undefined && totalQty > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
              ({totalQty} Unit)
            </span>
          )}
        </div>

        <Badge
          className={`px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider rounded-full shadow-2xs ${
            isInTransit
              ? 'bg-orange-500 text-white'
              : isCompleted
              ? 'bg-emerald-600 text-white'
              : isPending
              ? 'bg-amber-500 text-white'
              : isApproved
              ? 'bg-blue-600 text-white'
              : 'bg-destructive text-white'
          }`}
        >
          {status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Interactive Horizon Animation Canvas */}
      <div className="relative py-3 px-3 my-1">
        {/* Curving SVG Track */}
        <svg
          viewBox="0 0 400 60"
          className="w-full h-12 overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Background Shadow Track */}
          <path
            d="M 20 30 Q 200 10 380 30"
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Animated Running Dash Path */}
          <path
            ref={pathDashRef}
            d="M 20 30 Q 200 10 380 30"
            fill="none"
            stroke={isInTransit ? '#f97316' : isCompleted ? '#10b981' : '#cbd5e1'}
            strokeWidth="3.5"
            strokeDasharray={isInTransit ? '8 6' : isCompleted ? '400 0' : '4 4'}
            strokeLinecap="round"
            className="transition-colors duration-500"
          />
        </svg>

        {/* Nodes Layer Over Track */}
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          {/* Origin Point: Gudang Pusat */}
          <div className="relative flex flex-col items-center pointer-events-auto">
            {isPending && (
              <div
                ref={originPulseRef}
                className="absolute w-8 h-8 rounded-full bg-orange-500/30 -top-0.5 pointer-events-none"
              />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-xs transition-colors ${
              isCompleted || isInTransit || isApproved
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'bg-card border-orange-500 text-orange-600'
            }`}>
              <Boxes className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-foreground mt-1 tracking-tight">
              {fromName}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase font-mono">Asal</span>
          </div>

          {/* Center Dynamic Stage: Moving Truck / Flying Box */}
          <div className="relative flex flex-col items-center pointer-events-auto -mt-2">
            {isInTransit ? (
              <div
                ref={truckRef}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md border border-white/20 flex items-center gap-1.5"
              >
                <Truck className="w-5 h-5" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest hidden sm:inline">
                  OTW
                </span>
              </div>
            ) : isCompleted ? (
              <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-md flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : isApproved ? (
              <div
                ref={packageFloatRef}
                className="p-2.5 rounded-2xl bg-blue-500 text-white shadow-md flex items-center justify-center"
              >
                <Package className="w-5 h-5" />
              </div>
            ) : isRejected ? (
              <div className="p-2.5 rounded-2xl bg-destructive text-white shadow-md flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            ) : (
              <div
                ref={packageFloatRef}
                className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md flex items-center justify-center"
              >
                <Clock className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Destination Point: Toko Cabang */}
          <div className="relative flex flex-col items-center pointer-events-auto">
            {isInTransit && (
              <div
                ref={destPulseRef}
                className="absolute w-8 h-8 rounded-full bg-emerald-500/40 -top-0.5 pointer-events-none"
              />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-xs transition-colors ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-card border-border text-muted-foreground'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-foreground mt-1 tracking-tight">
              {toName}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase font-mono">Tujuan</span>
          </div>
        </div>
      </div>

      {/* Bottom Milestone Stepper Indicator */}
      <div className="pt-2 border-t border-border/80 mt-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-orange-500'}`} />
            <span className="text-foreground font-semibold">Status Alur:</span>
            <span className="text-orange-600 dark:text-orange-400 font-bold">
              {statusNarrative}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[9.5px]">
            <span className={isPending ? 'font-bold text-foreground' : 'text-muted-foreground'}>1. Minta</span>
            <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/60" />
            <span className={isApproved ? 'font-bold text-foreground' : 'text-muted-foreground'}>2. Siap</span>
            <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/60" />
            <span className={isInTransit ? 'font-bold text-orange-600' : 'text-muted-foreground'}>3. Kirim</span>
            <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/60" />
            <span className={isCompleted ? 'font-bold text-emerald-600' : 'text-muted-foreground'}>4. Sampai</span>
          </div>
        </div>
      </div>
    </div>
  );
};
