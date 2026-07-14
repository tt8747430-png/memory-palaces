import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

export function Textarea({
  className,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full resize-none rounded-control border border-border bg-card px-3.5 py-3',
        'text-[length:var(--p-text-body)] leading-relaxed text-foreground',
        'placeholder:text-muted-foreground transition-shadow',
        className,
      )}
      {...props}
    />
  )
}
