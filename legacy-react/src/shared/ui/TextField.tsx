import type { InputHTMLAttributes, Ref } from 'react'
import { cn } from '@/shared/lib'

export function TextField({
  className,
  type,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
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
