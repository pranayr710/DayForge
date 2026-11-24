import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

/** Track the pointer so the glass surface can paint a soft spotlight. */
function trackSpotlight(e: React.PointerEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  el.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

export function Card({
  className,
  elevated = false,
  interactive = false,
  onPointerMove,
  ...props
}: CardProps) {
  return (
    <div
      onPointerMove={(e) => {
        trackSpotlight(e);
        onPointerMove?.(e);
      }}
      className={cn(
        'df-spotlight rounded-[22px] transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        elevated ? 'df-glass-elevated' : 'df-glass',
        interactive &&
          'hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_var(--df-specular),0_24px_60px_-28px_rgba(109,100,240,0.55)]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 pt-4 pb-2.5 sm:px-5 sm:pt-5',
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--df-text)]',
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 pb-4 sm:px-5 sm:pb-5', className)} {...props} />;
}
