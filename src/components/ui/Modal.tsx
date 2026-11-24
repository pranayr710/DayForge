import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-lg',
}: ModalProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-[radial-gradient(80%_60%_at_50%_40%,rgba(40,34,110,0.35),rgba(3,4,8,0.78))] backdrop-blur-[10px]"
          />
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98, filter: 'blur(4px)' }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 340, damping: 30 }
            }
            className={cn(
              'relative z-10 w-full max-h-[90dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[26px] df-glass-elevated p-5 sm:p-6 safe-bottom',
              maxWidthClass
            )}
          >
            {/* Decorative aurora wash at the top edge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[inherit] bg-[radial-gradient(60%_100%_at_20%_0%,rgba(109,100,240,0.22),transparent_70%),radial-gradient(50%_100%_at_90%_0%,rgba(94,231,247,0.12),transparent_70%)]"
            />
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--df-border-strong)] sm:hidden" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--df-text)]">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--df-text-muted)]">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
