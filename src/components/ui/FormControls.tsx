import * as React from 'react';
import { cn } from '@/lib/utils';

const FIELD_BASE =
  'w-full rounded-xl border border-[var(--df-border)] bg-[var(--df-inset)] backdrop-blur-xl text-sm text-[var(--df-text)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] placeholder:text-[var(--df-text-faint)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-[var(--df-border-strong)] focus-visible:outline-none focus-visible:border-[#8F87FA]/70 focus-visible:bg-[var(--df-secondary)] focus-visible:shadow-[0_0_0_4px_rgba(109,100,240,0.18),0_0_24px_-6px_rgba(109,100,240,0.55)] disabled:opacity-50';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(FIELD_BASE, 'h-9 px-3', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(FIELD_BASE, 'min-h-[84px] px-3 py-2.5 leading-relaxed', className)}
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
      FIELD_BASE,
      'h-9 cursor-pointer appearance-none pl-3 pr-8 bg-no-repeat',
      'bg-[image:url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%238F87FA%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27><path d=%27m6 9 6 6 6-6%27/></svg>")] bg-[position:right_0.7rem_center]',
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
    <div className="mb-1.5 flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--df-text-faint)]"
      >
        {children}
      </label>
      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-[#F58A8A]">
          <span className="h-1 w-1 rounded-full bg-current" />
          {error}
        </span>
      )}
    </div>
  );
}
