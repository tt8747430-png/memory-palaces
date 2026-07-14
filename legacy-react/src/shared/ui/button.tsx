import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-medium select-none rounded-control ' +
  'transition-transform duration-200 ease-out active:scale-[0.97] ' +
  'disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-interactive',
  secondary: 'bg-secondary text-secondary-foreground',
  ghost: 'bg-card text-heading border border-border shadow-rest',
  destructive: 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[length:var(--p-text-label)]',
  md: 'h-11 px-5 text-[length:var(--p-text-body)]',
  lg: 'h-12 px-6 text-[length:var(--p-text-sub)]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(base, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    />
  )
}
