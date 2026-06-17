import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

export interface CollectionPreviewProps {
  title: string
  /** Visible "See all" affordance text. */
  seeAllLabel: string
  /** Specific accessible name for the whole block (e.g. "See all badges"). */
  ariaLabel: string
  onSeeAll: () => void
  /** The preview row (a few medallion stacks). Decorative; the section itself navigates. */
  children: ReactNode
}

/**
 * A profile section that previews a collection (badges, achievements) and opens its full
 * page. The entire block is one tap target — header + the medallion row — matching the
 * "tap the row to see all" pattern, so the previews stay decorative (no nested buttons).
 */
export function CollectionPreview({
  title,
  seeAllLabel,
  ariaLabel,
  onSeeAll,
  children,
}: CollectionPreviewProps) {
  return (
    <section>
      <button
        type="button"
        onClick={onSeeAll}
        aria-label={ariaLabel}
        className="group w-full rounded-card text-left transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="mb-3.5 flex items-center justify-between px-1">
          <span className="text-[length:var(--p-text-title)] font-bold text-heading">{title}</span>
          <span className="flex items-center gap-0.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground">
            {seeAllLabel}
            <ChevronRight className="size-4 transition-transform group-active:translate-x-0.5" aria-hidden />
          </span>
        </span>
        <span className="flex items-start justify-between gap-2">{children}</span>
      </button>
    </section>
  )
}
