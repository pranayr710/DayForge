import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

export function ProgressBar({
  value,
  className,
  barClassName,
  label,
}: ProgressBarProps) {
  const safe = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] dark:bg-white/[0.07]',
        className
      )}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-[#635BDB] to-[#8178F5] transition-all duration-500 ease-out',
          barClassName
        )}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl df-glass',
        className
      )}
    />
  );
}

export interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
  className?: string;
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: SegmentedTabsProps<T>) {
  const groupId = useId();
  const reduced = useReducedMotion();

  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-xl df-glass p-1',
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer select-none',
              active
                ? 'text-white'
                : 'text-[var(--df-text-muted)] hover:text-[var(--df-text)]'
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-pill-${groupId}`}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 32 }
                }
                className="absolute inset-0 rounded-lg bg-gradient-to-b from-[#6F67E5] to-[#5B52D1] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  'relative z-10 rounded px-1.5 py-0.2 text-[10px] font-mono-tabular',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.06] text-[var(--df-text-muted)]'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
