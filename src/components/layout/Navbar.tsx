import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useInventory } from '../../context/InventoryContext';
import { 
  Sun, Moon, LogOut, Package2, 
  Warehouse, Store, WifiOff
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { currentUser, currentLocation, isWarehouseAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOfflineMode } = useInventory();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F1012]/95 backdrop-blur-md border-b border-[#EAEAEA] dark:border-[#26282E] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Left: Clean Brand & Location Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Drawer Toggle */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-[#787774] dark:text-[#A1A09E] hover:bg-[#F7F6F3] dark:hover:bg-[#1C1E22] active:scale-90 transition-all"
              aria-label="Menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Minimalist Technical Mark */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center shrink-0 shadow-sm">
            <Package2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-bold text-xs sm:text-sm tracking-tight text-[#111111] dark:text-[#ECECED]">
              SG<span className="hidden xs:inline">·Gudang</span>
            </span>

            <span className="text-[#EAEAEA] dark:text-[#2B2D33]">/</span>

            {/* Location Pill */}
            <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono uppercase tracking-wider border font-bold shrink-0 ${
              isWarehouseAdmin 
                ? 'bg-[#F7F6F3] text-[#111111] border-[#EAEAEA] dark:bg-[#1C1E22] dark:text-[#ECECED] dark:border-[#2B2D33]'
                : 'bg-[#EDF3EC] text-[#346538] border-[#D4E5D3] dark:bg-[#172B19] dark:text-[#96D99C] dark:border-[#223F25]'
            }`}>
              {isWarehouseAdmin 
                ? 'Gudang Pusat' 
                : currentLocation?.name.replace(' (Cabang Barat)', ' Barat').replace(' (Cabang Selatan)', ' Selatan').replace(' (Cabang Timur)', ' Timur')}
            </span>

            {/* Offline / Local Storage Fallback Badge */}
            {isOfflineMode && (
              <span 
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-medium tracking-tight bg-[#FFF7D6] text-[#8F6B00] border border-[#FFE885] dark:bg-[#332B00] dark:text-[#FFDF6D] dark:border-[#5C4F00] shrink-0 animate-pulse"
                title="Aplikasi berjalan dalam mode offline / penyimpanan lokal"
              >
                <WifiOff className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: User Profile, Theme & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#A1A09E] px-2 py-1 rounded-lg">
            {isWarehouseAdmin ? (
              <Warehouse className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Store className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="font-medium text-[#111111] dark:text-[#ECECED] truncate max-w-[120px]">
              {currentUser?.full_name}
            </span>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-[#787774] dark:text-[#A1A09E] hover:text-[#111111] dark:hover:text-white border border-[#EAEAEA] dark:border-[#26282E] hover:bg-[#F7F6F3] dark:hover:bg-[#1C1E22] transition-colors active:scale-95"
            title="Ganti Tema"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9F2F2D] dark:text-[#F8A4A4] bg-[#FDEBEC] dark:bg-[#381B1B] border border-[#F8D2D4] dark:border-[#522525] hover:opacity-90 active:scale-95 transition-all"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>

      </div>
    </header>
  );
};
