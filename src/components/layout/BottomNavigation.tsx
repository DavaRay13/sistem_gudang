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
      badgeColor: 'bg-[#FBF3DB] text-[#956400] dark:bg-[#332A15] dark:text-[#E8CA65]',
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
      badgeColor: 'bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[#381B1B] dark:text-[#F8A4A4]',
    },
    {
      id: 'store_create_request' as NavigationTab,
      label: 'Minta Stok',
      icon: PlusCircle,
    },
    {
      id: 'store_receiving' as NavigationTab,
      label: 'Terima',
      icon: CheckSquare,
      badge: inTransitCount > 0 ? inTransitCount : undefined,
      badgeColor: 'bg-[#E1F3FE] text-[#1F6C9F] dark:bg-[#142838] dark:text-[#97D2FB]',
    },
    {
      id: 'store_request_history' as NavigationTab,
      label: 'Riwayat',
      icon: ClipboardList,
    },
  ];

  const tabs = isWarehouseAdmin ? warehouseTabs : storeTabs;

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto pointer-events-none">
      <nav className="pointer-events-auto bg-white/95 dark:bg-[#16171A]/95 backdrop-blur-md border border-[#EAEAEA] dark:border-[#26282E] rounded-2xl px-2 py-1.5 shadow-sm flex items-center justify-around transition-all">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors active:scale-95 ${
                isActive
                  ? 'text-[#111111] dark:text-white font-semibold'
                  : 'text-[#787774] dark:text-[#A1A09E] hover:text-[#111111]'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {tab.badge !== undefined && (
                  <span className={`absolute -top-1.5 -right-2 px-1 rounded-full text-[9px] font-mono font-medium border border-white dark:border-[#16171A] ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
