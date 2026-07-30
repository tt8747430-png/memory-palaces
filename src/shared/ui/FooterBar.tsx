import type { ComponentProps } from 'react'
import { cn, keepFieldFocused } from '@/shared/lib'

export function FooterBar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="footer-bar"
      onMouseDown={keepFieldFocused}
      className={cn(
        'relative shrink-0 border-t border-border bg-glass px-4 pt-3 pb-(--app-bottom-inset)',
        'shadow-[0_-10px_30px_oklch(var(--p-tint-navy)/0.1)]',
        className,
      )}
      {...props}
    />
  )
}
