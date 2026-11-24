import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function DayForgeLogo({ className = 'h-7 w-7' }: { className?: string }) {
  const gid = useId().replace(/:/g, '');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`lg-bg-${gid}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B1D33" />
          <stop offset="1" stopColor="#0B0C16" />
        </linearGradient>
        <linearGradient id={`lg-stroke-${gid}`} x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A59FFB" />
          <stop offset="0.55" stopColor="#7B72F6" />
          <stop offset="1" stopColor="#5EE7F7" />
        </linearGradient>
        <radialGradient id={`lg-glow-${gid}`} cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#8F87FA" stopOpacity="0.45" />
          <stop offset="1" stopColor="#8F87FA" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#lg-bg-${gid})`} />
      <rect width="64" height="64" rx="16" fill={`url(#lg-glow-${gid})`} />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="15"
        stroke={`url(#lg-stroke-${gid})`}
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <path
        d="M17 17H33C43.5 17 50 23.2 50 32C50 40.8 43.5 47 33 47H17V17Z"
        stroke={`url(#lg-stroke-${gid})`}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M25 25H32.5C37.5 25 41 28 41 32C41 36 37.5 39 32.5 39H25V25Z"
        fill={`url(#lg-stroke-${gid})`}
      />
      <circle cx="45" cy="18" r="3.5" fill="#5EE7F7" />
    </svg>
  );
}

/** Fixed, slowly drifting aurora light field with grain — sits behind the whole app. */
export function AuroraBackdrop() {
  return (
    <div className="df-aurora" aria-hidden="true">
      <div className="df-aurora__blob df-aurora__blob--1" />
      <div className="df-aurora__blob df-aurora__blob--2" />
      <div className="df-aurora__blob df-aurora__blob--3" />
      <div className="df-aurora__blob df-aurora__blob--4" />
      <div className="df-aurora__grid" />
      <div className="df-aurora__grain" />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5EE7F7] shadow-[0_0_10px_#5EE7F7]" />
          <span className="df-eyebrow">DayForge</span>
          <span className="h-px w-10 bg-gradient-to-r from-[var(--df-border-strong)] to-transparent" />
        </div>
        <h1 className="df-text-gradient text-[28px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[34px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--df-text-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-[var(--df-border-strong)] bg-[var(--df-inset)] px-6 py-10 text-center',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-6 h-28 w-28 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(109,100,240,0.35),transparent)] blur-xl df-breathe"
      />
      <div className="df-float relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#8F87FA]/35 bg-[linear-gradient(145deg,rgba(109,100,240,0.25),rgba(94,231,247,0.08))] text-[var(--df-accent-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_30px_-10px_rgba(109,100,240,0.8)]">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="relative text-sm font-semibold tracking-tight text-[var(--df-text)]">{title}</h4>
      <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--df-text-muted)]">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="relative mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-sm">
      <p className="text-sm leading-relaxed text-[var(--df-text-muted)]">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
