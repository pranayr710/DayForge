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
  neutral: 'bg-[var(--df-elevated)] text-[var(--df-text-muted)] border-[var(--df-border)]',
  accent: 'bg-[#635BDB]/15 text-[#8178F5] border-[#635BDB]/30',
  success: 'bg-[#16A34A]/15 text-[#22C55E] border-[#16A34A]/30',
  warning: 'bg-[#E5A03C]/15 text-[#E5A03C] border-[#E5A03C]/30',
  error: 'bg-[#E05252]/15 text-[#E05252] border-[#E05252]/30',
  info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight',
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  );
}
