import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { createId, cn } from '@/lib/utils';

type ToastTone = 'success' | 'info' | 'warning' | 'error';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (title: string, opts?: { description?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastMessage[]>([]);
  const reduced = useReducedMotion();

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, opts?: { description?: string; tone?: ToastTone }) => {
      const id = createId('toast');
      const tone = opts?.tone ?? 'info';
      setItems((prev) => [
        ...prev.slice(-3),
        { id, title, description: opts?.description, tone },
      ]);
      window.setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed right-4 bottom-20 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 md:bottom-4 pointer-events-none"
        aria-live="polite"
      >
        <AnimatePresence>
          {items.map((item) => {
            const Icon =
              item.tone === 'success'
                ? CheckCircle2
                : item.tone === 'warning' || item.tone === 'error'
                  ? AlertTriangle
                  : Info;
            return (
              <motion.div
                key={item.id}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.16 }}
                className={cn(
                  'pointer-events-auto flex items-start gap-2.5 rounded-2xl df-glass-elevated p-3 shadow-xl',
                  item.tone === 'error' && 'border-[#E05252]/40',
                  item.tone === 'success' && 'border-[#16A34A]/40'
                )}
              >
                <Icon
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    item.tone === 'success' && 'text-[#16A34A]',
                    item.tone === 'warning' && 'text-[#E5A03C]',
                    item.tone === 'error' && 'text-[#E05252]',
                    item.tone === 'info' && 'text-[#8178F5]'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--df-text)]">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 text-[11px] text-[var(--df-text-muted)]">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="text-[var(--df-text-muted)] hover:text-[var(--df-text)] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
