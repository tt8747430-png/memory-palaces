import type { ReactNode } from 'react'
import { accentStyleOf, type ActionId } from '@/shared/config/actions'
import { cn } from '@/shared/lib'
import { actionIcon } from '@/shared/ui'

export interface ActionFaceProps {
  action: ActionId
  /**
   * Off the strip: the dashed outline standing in for the tile, in the same place at the same size,
   * so switching an action on moves nothing.
   */
  off?: boolean
  /** Lifted off the strip: the copy under the finger during a drag. */
  floating?: boolean
  /** Hung on the face's corner — the palette's on/off mark. */
  children?: ReactNode
  className?: string
}

/**
 * An action as the swipe rails draw it: a 36px tile in the action's own colour, or the outline that
 * stands in for one. The palette, the rails and the drag overlay all draw this one face, so what a
 * learner arranges is drawn exactly as what they get. (The select bar draws `SelectToolbarSlot`,
 * the live toolbar's own slot, for the same reason.)
 */
export function ActionFace({
  action,
  off = false,
  floating = false,
  children,
  className,
}: ActionFaceProps) {
  const accent = accentStyleOf(action)
  return (
    <span
      style={off ? undefined : { backgroundColor: accent.fill, color: accent.ink }}
      className={cn(
        'relative grid size-9 shrink-0 place-items-center [&>svg]:size-4',
        off
          ? 'rounded-tile-slot border-2 border-dashed border-border text-muted-foreground'
          : 'rounded-tile shadow-rest',
        floating && 'shadow-elevated',
        className,
      )}
    >
      {actionIcon(action)}
      {children}
    </span>
  )
}
