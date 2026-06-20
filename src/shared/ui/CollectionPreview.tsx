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
 * A profile section that previews a collection (badges, achievements). The "See all"
 * control opens the full page; each previewed medallion is its own tap target into its
 * detail, so a medallion behaves the same here as it does on the full wall. The header
 * and the row are siblings (no nested buttons).
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
      <div className="mb-3.5 flex items-center justify-between px-1">
        <h2 className="text-[length:var(--p-text-title)] font-bold text-heading">{title}</h2>
        <button
          type="button"
          onClick={onSeeAll}
          aria-label={ariaLabel}
          className="group -mr-1 flex items-center gap-0.5 rounded-control px-1 py-0.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {seeAllLabel}
          <ChevronRight
            className="size-4 transition-transform group-active:translate-x-0.5"
            aria-hidden
          />
        </button>
      </div>
      <div className="flex items-start justify-between gap-2">{children}</div>
    </section>
  )
}
