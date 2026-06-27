import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib'

/** Multi-line text input, styled to match {@link TextField}: white surface, hairline
 * border, 12px radius, ink text, AA-contrast placeholder, no manual resize. Pass
 * `aria-label` for an accessible name when there's no visible label. */
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
