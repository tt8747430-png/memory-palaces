import { useTranslation } from 'react-i18next'
import { accentStyleOf, ACTION_META } from '@/shared/config/actions'
import type { SelectActionId } from '@/shared/config/select-toolbar'
import { cn } from '@/shared/lib'
import { selectActionIcon } from './select-actions'

const LAYOUT =
  'relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control px-0.5'

export interface SelectToolbarSlotProps {
  action: SelectActionId
  disabled?: boolean
  /**
   * Left off to draw the slot without wiring it — the settings preview shows the bar rather than
   * offering it. Same rule as `CloseBadge`: no handler, no button.
   */
  onClick?: () => void
  className?: string
}

/**
 * One slot of the toolbar: a tile in the action's accent, its icon in the accent's ink, its name
 * beneath in the pill's ink. Drawn the same way in the bar and in the settings preview of it, so
 * what the learner arranges is what the learner gets.
 */
export function SelectToolbarSlot({
  action,
  disabled,
  onClick,
  className,
}: SelectToolbarSlotProps) {
  const { t } = useTranslation()
  const accent = accentStyleOf(action)
  const label = t(ACTION_META[action].labelKey as never)
  const body = (
    <>
      <span
        aria-hidden
        style={{ backgroundColor: accent.fill, color: accent.ink }}
        className="grid size-8 shrink-0 place-items-center rounded-squircle shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
      >
        {selectActionIcon(action)}
      </span>
      <span className="w-full truncate text-center text-tiny font-semibold text-(--nav-ink)">
        {label}
      </span>
    </>
  )

  if (!onClick) return <span className={cn(LAYOUT, className)}>{body}</span>
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        LAYOUT,
        'transition-transform active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
        className,
      )}
    >
      {body}
    </button>
  )
}
