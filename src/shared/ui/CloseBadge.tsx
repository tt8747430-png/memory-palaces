import { X } from 'lucide-react'
import { cn } from '@/shared/lib'

export type CloseBadgeSize = 'sm' | 'md'
export type CloseBadgeCorner = 'start' | 'end'

/** `sm` stands on a tile in an editor; `md` on a whole bar. */
const SIZE: Record<CloseBadgeSize, string> = {
  sm: 'size-5 [&_svg]:size-3',
  md: 'size-7 [&_svg]:size-4',
}

/**
 * Where the badge straddles, and the 44px it answers to (MOBILE_DESIGN §3) — grown by a `before`
 * box upward and back over the thing it closes, never out past its own edge. A badge sits on a
 * corner with a neighbour beside it, and a hit area reaching sideways would take that neighbour's
 * first press: the row's own gap (`CLOSE_BADGE_ROW_GAP`) is then the whole distance between them.
 */
const CORNER: Record<CloseBadgeSize, Record<CloseBadgeCorner, string>> = {
  sm: {
    start: '-left-1 -top-1 before:-top-6 before:left-0 before:-right-6 before:bottom-0',
    end: '-right-1 -top-1 before:-top-6 before:-left-6 before:right-0 before:bottom-0',
  },
  md: {
    start: '-left-2.5 -top-2.5 before:-top-4 before:-left-1 before:-right-3 before:bottom-0',
    end: '-right-2.5 -top-2.5 before:-top-4 before:-left-3 before:-right-1 before:bottom-0',
  },
}

/**
 * The gap a row of badged tiles keeps: ≥ 8px (MOBILE_DESIGN §3) between one tile's badge hit area
 * and the tile beside it, since the `sm` badge stands 4px past its tile's edge.
 */
export const CLOSE_BADGE_ROW_GAP = 'gap-3'

const FACE =
  'absolute z-10 grid place-items-center rounded-full bg-heading text-(--surface) shadow-rest before:absolute'

export type CloseBadgeProps = {
  size?: CloseBadgeSize
  corner?: CloseBadgeCorner
  className?: string
} & (
  | { label: string; onClick: () => void }
  /** The copy a drag carries in its overlay: drawn so the lifted item is the item, never pressed. */
  | { label?: undefined; onClick?: undefined }
)

/**
 * The round ✕ standing on the corner of whatever it closes or removes — a selection toolbar, an
 * action tile in an editor. The parent is `relative`; the badge straddles its corner rather than
 * taking a slot inside it, so it never costs the row a column.
 */
export function CloseBadge({
  size = 'sm',
  corner = 'end',
  className,
  label,
  onClick,
}: CloseBadgeProps) {
  const face = cn(FACE, SIZE[size], CORNER[size][corner], className)
  const icon = <X strokeWidth={3} aria-hidden />

  if (!onClick) {
    return (
      <span aria-hidden className={face}>
        {icon}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        face,
        'transition-[transform,background-color] duration-150 ease-out hover:bg-heading/85 active:scale-90',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
      )}
    >
      {icon}
    </button>
  )
}
