import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { NavigationTab } from './Sidebar';
import { 
  LayoutDashboard, Package, ClipboardList, Send, 
  BookOpen, CheckSquare, PlusCircle
} from 'lucide-react';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { isWarehouseAdmin, currentLocation } = useAuth();
  const { requests, inventories } = useInventory();

  // Badge counts
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedForDispatchCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'PARTIAL').length;
  
  const myLocationId = currentLocation?.id;
  const inTransitCount = requests.filter(
    r => r.to_location_id === myLocationId && r.status === 'IN_TRANSIT'
  ).length;

  const lowStockCount = inventories.filter(
    inv => inv.location_id === myLocationId && inv.stock_available <= 5
  ).length;

  const warehouseTabs = [
    {
      id: 'warehouse_dashboard' as NavigationTab,
      label: 'Beranda',
      icon: LayoutDashboard,
    },
    {
      id: 'warehouse_master_items' as NavigationTab,
      label: 'Stok',
      icon: Package,
    },
    {
      id: 'warehouse_approval_queue' as NavigationTab,
      label: 'Persetujuan',
      icon: ClipboardList,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'warehouse_dispatch' as NavigationTab,
      label: 'Kirim',
      icon: Send,
      badge: approvedForDispatchCount > 0 ? approvedForDispatchCount : undefined,
      badgeColor: 'bg-indigo-500 text-white',
    },
    {
      id: 'warehouse_mutation_ledger' as NavigationTab,
      label: 'Riwayat',
      icon: BookOpen,
    },
  ];

  const storeTabs = [
    {
      id: 'store_dashboard' as NavigationTab,
      label: 'Beranda',
      icon: LayoutDashboard,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'store_create_request' as NavigationTab,
      label: 'Minta Stok',
      icon: PlusCircle,
    },
    {
      id: 'store_request_history' as NavigationTab,
      label: 'Riwayat',
      icon: ClipboardList,
    },
    {
      id: 'store_receiving' as NavigationTab,
      label: 'Terima',
      icon: CheckSquare,
      badge: inTransitCount > 0 ? inTransitCount : undefined,
      badgeColor: 'bg-emerald-500 text-white animate-pulse',
    },
  ];

  const tabs = isWarehouseAdmin ? warehouseTabs : storeTabs;

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto pointer-events-none">
      <nav className="pointer-events-auto bg-slate-900/90 dark:bg-[#0c1220]/95 backdrop-blur-2xl border border-slate-700/60 dark:border-slate-800 rounded-3xl px-3 py-2 shadow-2xl shadow-black/60 flex items-center justify-around transition-all">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? isWarehouseAdmin
                    ? 'text-indigo-400 font-bold'
                    : 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Glow Pill on Top */}
              {isActive && (
                <span className={`absolute -top-1.5 w-6 h-1 rounded-full ${
                  isWarehouseAdmin ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                }`} />
              )}

              <div className="relative mt-0.5">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && (
                  <span className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-slate-900 ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
