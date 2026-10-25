import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useInventory } from '../../context/InventoryContext';
import { 
  Sun, Moon, LogOut, Package2, 
  Warehouse, Store, WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { currentUser, currentLocation, isWarehouseAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOfflineMode } = useInventory();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Left: Clean Brand & Location Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Drawer Toggle */}
          {onToggleMobileMenu && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleMobileMenu}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          )}

          {/* Minimalist Technical Mark */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0 shadow-xs">
            <Package2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-bold text-xs sm:text-sm tracking-tight text-foreground">
              SG<span className="hidden xs:inline">·Gudang</span>
            </span>

            <span className="text-border">/</span>

            {/* Location Pill */}
            <Badge 
              variant="outline"
              className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider font-bold shrink-0 ${
                isWarehouseAdmin 
                  ? 'bg-muted/80 text-foreground border-border/80 shadow-2xs'
                  : 'bg-gradient-to-r from-emerald-50 to-emerald-100/70 text-emerald-800 border-emerald-300 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-2xs'
              }`}
            >
              {isWarehouseAdmin 
                ? 'Gudang Pusat' 
                : currentLocation?.name.replace(' (Cabang Barat)', ' Barat').replace(' (Cabang Selatan)', ' Selatan').replace(' (Cabang Timur)', ' Timur')}
            </Badge>

            {/* Offline / Local Storage Fallback Badge */}
            {isOfflineMode && (
              <Badge 
                variant="outline"
                className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-medium tracking-tight bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-800 border-amber-300 dark:from-amber-950/60 dark:to-amber-900/40 dark:text-amber-300 dark:border-amber-700/60 shrink-0 animate-pulse"
                title="Aplikasi berjalan dalam mode offline / penyimpanan lokal"
              >
                <WifiOff className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Offline</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Right Actions: User Profile, Theme & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-lg">
            {isWarehouseAdmin ? (
              <Warehouse className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Store className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="font-medium text-foreground truncate max-w-[120px]">
              {currentUser?.full_name}
            </span>
          </div>

          {/* Dark / Light Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            title="Ganti Tema"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Logout Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              logout();
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="gap-1.5"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>

      </div>
    </header>
  );
};
