import { FlyoutMenu } from './FlyoutMenu'
import type { IconButtonSize, IconButtonVariant } from './IconButton'
import type { SheetAction } from './ActionSheet'

export interface OverflowMenuButtonProps {
  /** Accessible name for the ⋮ trigger (e.g. "More options"). */
  label: string
  actions: SheetAction[]
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Which side of the trigger the panel opens on. */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** How the panel aligns to the trigger along that side. */
  align?: 'start' | 'center' | 'end'
  className?: string
}

/** A kebab (⋮) button that opens an anchored {@link FlyoutMenu} of overflow actions — the
 * top-right "more" affordance on screen headers and list rows. The menu springs from the
 * control under the thumb rather than sliding a bottom sheet up, so it stays in context. */
export function OverflowMenuButton({
  label,
  actions,
  variant = 'ghost',
  size = 'md',
  side = 'bottom',
  align = 'end',
  className,
}: OverflowMenuButtonProps) {
  return (
    <FlyoutMenu
      label={label}
      actions={actions}
      variant={variant}
      size={size}
      side={side}
      align={align}
      className={className}
    />
  )
}
