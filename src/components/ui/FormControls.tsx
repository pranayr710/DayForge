import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 w-full rounded-xl border border-[var(--df-border)] bg-[var(--df-bg)]/75 backdrop-blur-md px-3 text-sm text-[var(--df-text)] placeholder:text-[var(--df-text-muted)]/60 transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#635BDB] focus-visible:ring-2 focus-visible:ring-[#635BDB]/40 disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[80px] w-full rounded-xl border border-[var(--df-border)] bg-[var(--df-bg)]/75 backdrop-blur-md px-3 py-2 text-sm text-[var(--df-text)] placeholder:text-[var(--df-text-muted)]/60 transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#635BDB] focus-visible:ring-2 focus-visible:ring-[#635BDB]/40 disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-9 w-full rounded-xl border border-[var(--df-border)] bg-[var(--df-solid-surface)] px-2.5 text-sm text-[var(--df-text)] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#635BDB] focus-visible:ring-2 focus-visible:ring-[#635BDB]/40 disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export function FieldLabel({
  htmlFor,
  children,
  error,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-[var(--df-text-muted)]"
      >
        {children}
      </label>
      {error && <span className="text-xs text-[#E05252]">{error}</span>}
    </div>
  );
}
