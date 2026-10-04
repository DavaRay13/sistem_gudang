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
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0b101b]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        
        {/* Left: Brand & Active Branch Badge & Mobile Toggle */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Mobile Menu Toggle Button (Drawer) */}
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors active:scale-95"
              aria-label="Buka Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Package2 className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight truncate font-display">
                Sistem<span className="text-indigo-600 dark:text-indigo-400">Gudang</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                isWarehouseAdmin 
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              }`}>
                {isWarehouseAdmin ? 'Gudang Pusat' : currentLocation?.name.replace(' (Cabang Barat)', '').replace(' (Cabang Selatan)', '').replace(' (Cabang Timur)', '')}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {isWarehouseAdmin ? (
                <Warehouse className="w-3 h-3 text-indigo-500 shrink-0" />
              ) : (
                <Store className="w-3 h-3 text-emerald-500 shrink-0" />
              )}
              <span className="truncate font-medium">{currentUser?.full_name}</span>
            </div>
          </div>
        </div>

        {/* Right Actions: Theme Toggle & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 border border-slate-200/60 dark:border-slate-800"
            title="Ganti Mode Tampilan"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Instant Logout Button */}
          <button
            onClick={() => {
              logout();
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition-all active:scale-95"
            title="Keluar dari Akun Langsung"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs hidden sm:inline font-bold">Keluar</span>
          </button>
        </div>

      </div>
    </header>
  );
};
