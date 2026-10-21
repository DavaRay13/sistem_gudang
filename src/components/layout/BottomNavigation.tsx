import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import { NavigationTab } from './Sidebar';
import { 
  LayoutDashboard, Package, Layers, 
  BookOpen, CheckSquare, PlusCircle, ClipboardList
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
      id: 'warehouse_pipeline' as NavigationTab,
      label: 'Proses',
      icon: Layers,
      badge: (pendingRequestsCount + approvedForDispatchCount) > 0 ? (pendingRequestsCount + approvedForDispatchCount) : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'warehouse_master_items' as NavigationTab,
      label: 'Barang',
      icon: Package,
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
      label: 'Minta Barang',
      icon: PlusCircle,
    },
    {
      id: 'store_receiving' as NavigationTab,
      label: 'Barang Masuk',
      icon: CheckSquare,
      badge: inTransitCount > 0 ? inTransitCount : undefined,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      id: 'store_request_history' as NavigationTab,
      label: 'Riwayat',
      icon: ClipboardList,
    },
  ];

  const tabs = isWarehouseAdmin ? warehouseTabs : storeTabs;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      {/* Safe area padding for phones with home indicator */}
      <nav className="pointer-events-auto bg-white/90 dark:bg-[#16171A]/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 px-1 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-stretch justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 rounded-xl transition-all active:scale-90 ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className="relative">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-brand-600/10 dark:bg-brand-400/10'
                    : ''
                }`}>
                  <Icon className={`transition-all ${isActive ? 'w-5 h-5' : 'w-[18px] h-[18px]'}`} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                {tab.badge !== undefined && (
                  <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${tab.badgeColor} shadow-sm`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              
              <span className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[64px] transition-all ${
                isActive ? 'font-bold' : 'font-medium'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
