import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib'

/**
 * The chrome shared by every screen footer, and the counterpart to `HeaderBar`: glass background,
 * a lifted top edge, and the docked bottom inset. What sits inside belongs to whatever composes it
 * — a screen's primary action, the card editor's deck nav.
 *
 * The bar needs no keyboard handling of its own. `AppScreen` already ends at the top of the
 * keyboard, so a footer pinned below the scroller lands right on it; `--app-bottom-inset` drops to
 * its floor at the same moment, because the home indicator it otherwise clears is covered by the
 * keyboard and padding for it would only read as a gap (`theme.css`, `docs/CODE_STYLE.md` §11).
 */
export function FooterBar({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="footer-bar"
      className={cn(
        'relative shrink-0 border-t border-border bg-glass px-4 pt-3 pb-[var(--app-bottom-inset)]',
        'shadow-[0_-10px_30px_oklch(var(--p-tint-navy)/0.1)]',
        className,
      )}
      {...props}
    />
  )
}
