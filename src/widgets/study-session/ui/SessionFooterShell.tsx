import type { ReactNode } from 'react'

/**
 * The bar both footers sit in. One definition of the safe-area padding and the glass edge, so the
 * grade footer and the fast-review footer occupy exactly the same space and swapping between decks
 * never nudges the card above them.
 */
export function SessionFooterShell({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-t border-border/60 bg-card-glass px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-2.5">
      {children}
    </div>
  )
}
