import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Sun, Moon, LogOut, Package2, 
  Warehouse, Store
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { currentUser, currentLocation, isWarehouseAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0F1012]/90 backdrop-blur-md border-b border-[#EAEAEA] dark:border-[#26282E] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        
        {/* Left: Clean Brand & Location Badge */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Drawer Toggle */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-[#787774] dark:text-[#A1A09E] hover:bg-[#F7F6F3] dark:hover:bg-[#1C1E22] active:scale-95 transition-all"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Minimalist Technical Mark */}
          <div className="w-7 h-7 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center shrink-0">
            <Package2 className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-[#111111] dark:text-[#ECECED]">
              Sistem<span className="text-[#787774] dark:text-[#A1A09E] font-normal">Gudang</span>
            </span>

            <span className="text-[#EAEAEA] dark:text-[#2B2D33] hidden sm:inline">/</span>

            {/* Location Pill */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border shrink-0 ${
              isWarehouseAdmin 
                ? 'bg-[#F7F6F3] text-[#111111] border-[#EAEAEA] dark:bg-[#1C1E22] dark:text-[#ECECED] dark:border-[#2B2D33]'
                : 'bg-[#EDF3EC] text-[#346538] border-[#D4E5D3] dark:bg-[#172B19] dark:text-[#96D99C] dark:border-[#223F25]'
            }`}>
              {isWarehouseAdmin 
                ? 'Gudang Pusat' 
                : currentLocation?.name.replace(' (Cabang Barat)', '').replace(' (Cabang Selatan)', '').replace(' (Cabang Timur)', '')}
            </span>
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
