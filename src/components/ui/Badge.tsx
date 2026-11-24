import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral:
    'bg-[var(--df-inset)] text-[var(--df-text-muted)] border-[var(--df-border-strong)]',
  accent:
    'bg-[linear-gradient(135deg,rgba(109,100,240,0.20),rgba(167,139,250,0.10))] text-[var(--df-accent-secondary)] border-[#8F87FA]/35 shadow-[0_0_14px_-6px_rgba(109,100,240,0.7)]',
  success:
    'bg-[#22C55E]/12 text-[var(--df-success)] border-[#22C55E]/30 shadow-[0_0_14px_-6px_rgba(34,197,94,0.6)]',
  warning:
    'bg-[#F0B455]/12 text-[var(--df-warning)] border-[#F0B455]/30',
  error:
    'bg-[#F06A6A]/12 text-[var(--df-error)] border-[#F06A6A]/30',
  info:
    'bg-[#5EE7F7]/10 text-[var(--df-cyan)] border-[#5EE7F7]/30',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[10.5px] font-medium leading-none tracking-[0.01em] backdrop-blur-md',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
