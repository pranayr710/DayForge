import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: cn(
    'df-btn-shine text-white border border-white/20',
    'bg-[linear-gradient(135deg,#7B72F6_0%,#635BDB_45%,#5145C8_100%)]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_22px_-8px_rgba(99,91,219,0.75),0_0_0_1px_rgba(99,91,219,0.25)]',
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_12px_30px_-8px_rgba(109,100,240,0.9),0_0_0_1px_rgba(143,135,250,0.45)]',
    'hover:-translate-y-px active:translate-y-0 active:scale-[0.98]'
  ),
  secondary: cn(
    'bg-[var(--df-elevated)] backdrop-blur-xl text-[var(--df-text)] border border-[var(--df-border-strong)]',
    'shadow-[inset_0_1px_0_var(--df-specular),0_4px_14px_-8px_rgba(0,0,0,0.4)]',
    'hover:border-[#8F87FA]/45 hover:shadow-[inset_0_1px_0_var(--df-specular),0_8px_24px_-10px_rgba(109,100,240,0.5)]',
    'active:scale-[0.98]'
  ),
  outline: cn(
    'bg-[var(--df-secondary)] backdrop-blur-xl text-[var(--df-text)] border border-[var(--df-border)]',
    'hover:bg-[var(--df-elevated)] hover:border-[#8F87FA]/40 active:scale-[0.98]'
  ),
  ghost: cn(
    'bg-transparent text-[var(--df-text-muted)] border border-transparent',
    'hover:text-[var(--df-text)] hover:bg-[var(--df-inset)] hover:border-[var(--df-border)] active:scale-[0.97]'
  ),
  danger: cn(
    'bg-[#F06A6A]/12 backdrop-blur-xl text-[#F06A6A] border border-[#F06A6A]/30',
    'hover:bg-[#F06A6A]/20 hover:shadow-[0_8px_24px_-10px_rgba(240,106,106,0.6)] active:scale-[0.98]'
  ),
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-[10px] gap-1.5',
  md: 'h-9 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2',
  icon: 'h-9 w-9 rounded-xl justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-[-0.005em] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F87FA]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--df-bg)] disabled:pointer-events-none disabled:opacity-45 cursor-pointer select-none whitespace-nowrap',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
