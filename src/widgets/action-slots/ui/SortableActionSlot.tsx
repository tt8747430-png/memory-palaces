import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ACTION_META, type ActionId } from '@/shared/config/actions'
import { cn } from '@/shared/lib'
import { CloseBadge, SortableRow } from '@/shared/ui'

export interface SortableActionSlotProps {
  action: ActionId
  /** Takes it off the strip. Left off where the strip must keep it — the select bar's last. */
  onRemove?: () => void
  className?: string
  /** Its face, as the strip draws it. */
  children: ReactNode
}

/**
 * One action on a strip being arranged: the face is the drag handle, and the badge on its corner
 * takes it off. The badge is a sibling of the handle, not inside it — a button cannot hold another
 * button, and a press on the badge must never start a drag.
 */
export function SortableActionSlot({
  action,
  onRemove,
  className,
  children,
}: SortableActionSlotProps) {
  const { t } = useTranslation()
  const name = t(ACTION_META[action].labelKey as never)
  return (
    <SortableRow id={action} className={className}>
      {({ handleRef, handleProps, isDragging }) => (
        <>
          <button
            ref={handleRef}
            type="button"
            {...handleProps}
            aria-label={t('slots.reorder', { name })}
            className={cn(
              'relative flex h-full w-full cursor-grab touch-none rounded-tile active:cursor-grabbing',
              'transition-opacity hover:opacity-85',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
              // A 36px rail cap still takes a 44px press (MOBILE_DESIGN §3): the target is a
              // centred 44px box, which a larger face — the select bar's slot — already covers.
              'before:absolute before:left-1/2 before:top-1/2 before:size-11 before:-translate-1/2',
              isDragging && 'opacity-0',
            )}
          >
            {children}
          </button>
          {onRemove && !isDragging ? (
            <CloseBadge label={t('slots.remove', { name })} onClick={onRemove} />
          ) : null}
        </>
      )}
    </SortableRow>
  )
}
