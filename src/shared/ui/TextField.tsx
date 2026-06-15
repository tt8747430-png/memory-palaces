import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

/** Single-line text input. White surface, hairline border, 12px radius, ≥44px tall,
 * ink text, AA-contrast placeholder. Focus ring comes from the global navy
 * `:focus-visible`. Pass `aria-label` (no visible label) for an accessible name. */
export function TextField({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type ?? 'text'}
      className={cn(
        'h-11 w-full rounded-control border border-border bg-card px-3.5',
        'text-[length:var(--p-text-body)] text-foreground placeholder:text-muted-foreground',
        'transition-shadow',
        className,
      )}
      {...props}
    />
  )
}
