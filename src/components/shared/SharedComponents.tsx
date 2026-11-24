import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function DayForgeLogo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#191D25" />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="12"
        stroke="#635BDB"
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <path
        d="M17 17H33C43.5 17 50 23.2 50 32C50 40.8 43.5 47 33 47H17V17Z"
        stroke="#635BDB"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M25 25H32.5C37.5 25 41 28 41 32C41 36 37.5 39 32.5 39H25V25Z"
        fill="#635BDB"
      />
      <circle cx="44" cy="19" r="3.5" fill="#8178F5" />
    </svg>
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
  return (
    <div
      className={cn(
        'mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--df-text)] sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[var(--df-text-muted)] sm:text-sm">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
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
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--df-border)] bg-[var(--df-bg)]/50 px-6 py-8 text-center',
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--df-border)] bg-[var(--df-elevated)] text-[#8178F5]">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-medium text-[var(--df-text)]">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-[var(--df-text-muted)]">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-4">
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
      <p className="text-sm text-[var(--df-text-muted)]">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
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
