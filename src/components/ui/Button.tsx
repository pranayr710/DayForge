import * as React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-[#6F67E5] to-[#5B52D1] text-white hover:from-[#7A72EC] hover:to-[#635BDB] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_14px_-4px_rgba(99,91,219,0.45)] active:scale-[0.985]',
  secondary:
    'bg-[var(--df-elevated)] backdrop-blur-md text-[var(--df-text)] hover:border-[var(--df-border-strong)] border border-[var(--df-border)] shadow-[inset_0_1px_0_var(--df-specular)] active:scale-[0.985]',
  outline:
    'bg-[var(--df-secondary)] backdrop-blur-md text-[var(--df-text)] hover:bg-[var(--df-elevated)] hover:border-[var(--df-border-strong)] border border-[var(--df-border)] active:scale-[0.985]',
  ghost:
    'bg-transparent text-[var(--df-text-muted)] hover:text-[var(--df-text)] hover:bg-[var(--df-elevated)] border border-transparent active:scale-[0.985]',
  danger:
    'bg-[#E05252]/14 backdrop-blur-md text-[#E05252] hover:bg-[#E05252]/22 border border-[#E05252]/30 active:scale-[0.985]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-3.5 text-sm rounded-lg gap-2',
  lg: 'h-10 px-4 text-sm rounded-xl gap-2',
  icon: 'h-9 w-9 rounded-lg justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BDB] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--df-bg)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
