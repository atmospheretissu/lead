import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-2',
  accent: 'bg-violet text-white hover:bg-violet-strong',
  secondary: 'bg-white text-ink border border-line-strong hover:bg-canvas-2',
  ghost: 'text-ink-2 hover:bg-canvas-2',
  danger: 'bg-red text-white hover:opacity-90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px]',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-10 px-5 text-[14px]',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
