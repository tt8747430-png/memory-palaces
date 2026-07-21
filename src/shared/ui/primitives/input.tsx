import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type={type ?? 'text'}
      className={cn(
        'h-11 w-full rounded-control border border-border bg-card px-3.5',
        'text-[length:var(--p-text-body)] text-foreground placeholder:text-muted-foreground',
        'outline-none transition-shadow',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-[var(--danger)]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
