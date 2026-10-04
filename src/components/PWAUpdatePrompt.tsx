import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // ponytail: check for updates every hour; shorten if critical updates are frequent
      r && setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 max-w-sm animate-slide-up">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
        Versi baru tersedia! Perbarui untuk mendapatkan fitur terbaru.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setNeedRefresh(false)}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          Nanti
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Perbarui
        </button>
      </div>
    </div>
  );
}
