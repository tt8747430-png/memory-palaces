import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from '@/shared/lib'

export type IconButtonVariant = 'ghost' | 'tint' | 'solid' | 'glass' | 'danger'
export type IconButtonSize = 'sm' | 'md'

const base =
  'inline-grid place-items-center shrink-0 rounded-control select-none ' +
  'transition-transform duration-150 ease-out active:scale-[0.94] ' +
  'disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none'

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: 'text-heading hover:bg-info-surface',
  tint: 'bg-info-surface text-info-foreground',
  solid: 'bg-primary text-primary-foreground shadow-interactive',
  glass: 'bg-card-glass text-heading shadow-rest',
  danger: 'text-[var(--danger-on-surface)] hover:bg-[var(--danger-surface)]',
}

// md clears the 44px touch target; sm (36px) is for dense action rows.
const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'size-9',
  md: 'size-11',
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Required: the button shows only an icon, so it needs an accessible name. */
  'aria-label': string
  /** Forwarded to the underlying button — lets popover/menu triggers anchor to it. */
  ref?: Ref<HTMLButtonElement>
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  type,
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(base, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    />
  )
}
