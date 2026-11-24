import { useEffect, useId, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
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
  const reduced = useReducedMotion();
  return (
    <div
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--df-inset)] shadow-[inset_0_0_0_1px_var(--df-border)]',
        className
      )}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <motion.div
        initial={reduced ? false : { width: 0 }}
        animate={{ width: `${safe}%` }}
        transition={reduced ? { duration: 0 } : { duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'df-shimmer relative h-full rounded-full bg-[linear-gradient(90deg,#635BDB_0%,#A78BFA_55%,#5EE7F7_100%)] shadow-[0_0_12px_rgba(143,135,250,0.65)]',
          barClassName
        )}
      />
    </div>
  );
}

export interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
  /** Optional gradient stops override [from, via, to]. */
  colors?: [string, string, string];
  label?: string;
}

/** Glowing circular progress with an aurora gradient stroke. */
export function ProgressRing({
  value,
  size = 72,
  stroke = 6,
  className,
  children,
  colors = ['#8F87FA', '#A78BFA', '#5EE7F7'],
  label,
}: ProgressRingProps) {
  const safe = Math.min(100, Math.max(0, value));
  const gid = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(safe)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <defs>
          <linearGradient id={`ring-${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="55%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </linearGradient>
          <filter id={`glow-${gid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--df-border-strong)"
          strokeOpacity={0.55}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          filter={safe > 0 ? `url(#glow-${gid})` : undefined}
          initial={reduced ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - safe / 100) }}
          transition={reduced ? { duration: 0 } : { duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/** Counts up to the target number when it scrolls into view. */
export function AnimatedNumber({
  value,
  className,
  format = (n: number) => String(Math.round(n)),
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(fromRef.current, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [value, inView, reduced]);

  return (
    <span ref={ref} className={cn('font-mono-tabular', className)}>
      {format(display)}
    </span>
  );
}

/** Fade-and-rise entrance, staggered via `delay` (seconds). Plays once when visible. */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 16,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.6, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('df-skeleton rounded-[22px] border border-[var(--df-border)]', className)} />;
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
        'inline-flex flex-wrap items-center gap-1 rounded-2xl df-glass p-1',
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
              'relative inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer select-none',
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
                className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,#7B72F6,#5145C8)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_18px_-6px_rgba(109,100,240,0.8)]"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  'relative z-10 min-w-[18px] rounded-full px-1.5 py-px text-center text-[10px] font-mono-tabular',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--df-inset)] text-[var(--df-text-muted)] shadow-[inset_0_0_0_1px_var(--df-border)]'
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
