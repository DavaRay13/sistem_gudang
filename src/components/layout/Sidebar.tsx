import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { 
  LayoutDashboard, Package, ClipboardList, 
  BookOpen, PlusCircle, CheckSquare, 
  Warehouse, Store, AlertCircle, LogOut,
  Layers, Users
} from 'lucide-react';

export type NavigationTab = 
  // Warehouse Tabs
  | 'warehouse_dashboard'
  | 'warehouse_master_items'
  | 'warehouse_approval_queue'
  | 'warehouse_dispatch'
  | 'warehouse_mutation_ledger'
  | 'warehouse_user_management'
  // Store Tabs
  | 'store_dashboard'
  | 'store_create_request'
  | 'store_request_history'
  | 'store_receiving'
  // Warehouse Pipeline (combined view)
  | 'warehouse_pipeline';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { isWarehouseAdmin, currentLocation, logout } = useAuth();
  const { requests, inventories } = useInventory();

  // Badge counts
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedForDispatchCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'PARTIAL').length;
  
  // Store badge counts
  const myLocationId = currentLocation?.id;
  const inTransitCount = requests.filter(
    r => r.to_location_id === myLocationId && r.status === 'IN_TRANSIT'
  ).length;

  const lowStockCount = inventories.filter(
    inv => inv.location_id === myLocationId && inv.stock_available <= 5
  ).length;

  const warehouseMenuItems = [
    {
      id: 'warehouse_dashboard' as NavigationTab,
      label: 'Beranda Gudang',
      icon: LayoutDashboard,
      hint: 'Ringkasan stok & aktivitas',
    },
    {
      id: 'warehouse_pipeline' as NavigationTab,
      label: 'Proses Permintaan',
      icon: Layers,
      badge: (pendingRequestsCount + approvedForDispatchCount) > 0 ? (pendingRequestsCount + approvedForDispatchCount) : undefined,
      badgeColor: 'bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-800 border-amber-300 dark:from-amber-950/60 dark:to-amber-900/40 dark:text-amber-300 dark:border-amber-700/60 shadow-2xs',
      hint: 'Setujui & kirim barang ke toko',
    },
    {
      id: 'warehouse_master_items' as NavigationTab,
      label: 'Kelola Barang & Stok',
      icon: Package,
      hint: 'Master barang & stok masuk',
    },
    {
      id: 'warehouse_mutation_ledger' as NavigationTab,
      label: 'Riwayat Keluar Masuk',
      icon: BookOpen,
      hint: 'Catatan semua pergerakan stok',
    },
    {
      id: 'warehouse_user_management' as NavigationTab,
      label: 'Kelola Pengguna',
      icon: Users,
      hint: 'Akun staf toko & gudang',
    },
  ];

  const storeMenuItems = [
    {
      id: 'store_dashboard' as NavigationTab,
      label: 'Beranda Toko',
      icon: LayoutDashboard,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-gradient-to-r from-rose-50 to-rose-100/70 text-rose-800 border-rose-300 dark:from-rose-950/60 dark:to-rose-900/40 dark:text-rose-300 dark:border-rose-700/60 shadow-2xs',
      hint: 'Stok toko & daftar barang',
    },
    {
      id: 'store_create_request' as NavigationTab,
      label: 'Minta Tambah Stok',
      icon: PlusCircle,
      hint: 'Ajukan barang ke gudang pusat',
    },
    {
      id: 'store_receiving' as NavigationTab,
      label: 'Terima Barang Datang',
      icon: CheckSquare,
      badge: inTransitCount > 0 ? inTransitCount : undefined,
      badgeColor: 'bg-gradient-to-r from-sky-50 to-blue-100/70 text-sky-800 border-sky-300 dark:from-sky-950/60 dark:to-blue-900/40 dark:text-sky-300 dark:border-sky-700/60 shadow-2xs',
      hint: 'Hitung & konfirmasi kiriman tiba',
    },
    {
      id: 'store_request_history' as NavigationTab,
      label: 'Riwayat Permintaan',
      icon: ClipboardList,
      hint: 'Semua permintaan yang pernah dibuat',
    },
  ];

  const menuItems = isWarehouseAdmin ? warehouseMenuItems : storeMenuItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-14 z-50 lg:z-30 h-full lg:h-[calc(100vh-3.5rem)] w-64 shrink-0 bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col justify-between p-3.5 overflow-y-auto`}
      >
        <div>
          {/* Mobile Drawer Header */}
          <div className="lg:hidden flex items-center justify-between pb-3 mb-3 border-b border-sidebar-border">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Menu Sistem
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-md text-muted-foreground hover:bg-sidebar-accent"
              aria-label="Tutup"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Active Unit Box */}
          <div className="mb-3.5 p-2.5 rounded-lg bg-card border border-sidebar-border shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-muted text-foreground border border-border">
                {isWarehouseAdmin ? <Warehouse className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {isWarehouseAdmin ? 'Unit Pusat' : 'Unit Cabang'}
                </span>
                <span className="block text-xs font-semibold text-foreground truncate">
                  {currentLocation?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Navigasi
            </div>
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="font-medium">{item.label}</div>
                      {item.hint && !isActive && (
                        <div className="text-[10px] opacity-70 truncate">{item.hint}</div>
                      )}
                    </div>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Utilitarian Notice */}
        <div className="pt-3 border-t border-sidebar-border space-y-2">
          <div className="p-2.5 rounded-lg bg-card border border-sidebar-border text-[11px] text-muted-foreground shadow-2xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground mb-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Verifikasi Fisik</span>
            </div>
            <p className="leading-relaxed text-[10px]">
              Setiap pergerakan stok dicatat di ledger terpusat secara permanen.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              logout();
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
};
