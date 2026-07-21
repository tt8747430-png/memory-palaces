import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

function Textarea({ className, rows = 3, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        'w-full resize-none rounded-control border border-border bg-card px-3.5 py-3',
        'text-[length:var(--p-text-body)] leading-relaxed text-foreground',
        'placeholder:text-muted-foreground outline-none transition-shadow',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-[var(--danger)]',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
