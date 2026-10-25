import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overflow-x-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog / Bottom Sheet on Mobile */}
      <div className={`relative w-full max-w-full ${maxWidthClasses} bg-card text-card-foreground rounded-t-2xl sm:rounded-2xl border-t sm:border border-border shadow-2xl overflow-hidden transform transition-all max-h-[90dvh] sm:max-h-[88vh] flex flex-col`}>
        
        {/* Mobile Swipe / Drag Indicator */}
        <div className="sm:hidden w-full flex items-center justify-center pt-2.5 pb-1 bg-muted/40 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-border bg-muted/20 shrink-0 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-90 shrink-0 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with smooth scrolling and bottom safe padding */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 pb-6 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};
