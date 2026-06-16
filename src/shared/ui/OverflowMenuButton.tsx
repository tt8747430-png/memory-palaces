import { type ReactNode, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { IconButton, type IconButtonVariant } from './IconButton'
import { ActionSheet, type SheetAction } from './ActionSheet'

export interface OverflowMenuButtonProps {
  /** Accessible name for the ⋮ trigger (e.g. "More options"). */
  label: string
  /** Title shown at the top of the action sheet. */
  title: ReactNode
  description?: ReactNode
  actions: SheetAction[]
  cancelLabel: string
  variant?: IconButtonVariant
  className?: string
}

/** A kebab (⋮) button that opens an {@link ActionSheet} of overflow actions — the
 * top-right "more" affordance on screen headers and cards. Keeps the chrome to one
 * primary control and tucks the rest into a thumb-reachable sheet. */
export function OverflowMenuButton({
  label,
  title,
  description,
  actions,
  cancelLabel,
  variant = 'ghost',
  className,
}: OverflowMenuButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconButton
        variant={variant}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={className}
      >
        <MoreVertical className="size-5" aria-hidden />
      </IconButton>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        actions={actions}
        cancelLabel={cancelLabel}
      />
    </>
  )
}
