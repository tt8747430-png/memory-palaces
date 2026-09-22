import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { accentStyleOf, ACTION_META } from '@/shared/config/actions'
import type { SelectActionId, SelectToolbarConfig } from '@/shared/config/select-toolbar'
import { cn, type MultiSelect } from '@/shared/lib'
import { CloseBadge } from './CloseBadge'
import { type SelectActionHandlers, selectActionIcon } from './select-actions'

export interface SelectToolbarProps {
  actions: SelectToolbarConfig
  handlers: SelectActionHandlers
  selection: Pick<MultiSelect, 'exit'>
  className?: string
}

/**
 * The bottom slot's contents while a selection is on: up to four slots inside the nav's box, each
 * an action's own colour under its name, exactly as the swipe rails and the menus draw it. The
 * pill beneath is the dock's; this is only what sits on it. Swapping the nav for this is then a
 * change of contents, not of furniture.
 */
export function SelectToolbar({ actions, handlers, selection, className }: SelectToolbarProps) {
  const { t } = useTranslation()
  const shown = actions.filter((id) => handlers[id] != null)

  return (
    <div className={cn('relative h-full w-full', className)}>
      <SelectToolbarRow>
        {shown.map((id) => {
          const handler = handlers[id]!
          return (
            <SelectToolbarSlot
              key={id}
              action={id}
              disabled={handler.disabled}
              onClick={handler.onAction}
            />
          )
        })}
      </SelectToolbarRow>
      {/* Last in the tree so the badge paints over the slot beneath it. */}
      <CloseBadge
        size="md"
        corner="start"
        label={t('selection.exitSelectMode')}
        onClick={selection.exit}
      />
    </div>
  )
}

export interface SelectToolbarSlotProps {
  action: SelectActionId
  disabled?: boolean
  onClick?: () => void
  /** Drawn but inert — the settings preview shows the bar without running anything. */
  inert?: boolean
  className?: string
}

/**
 * One slot of the toolbar: a tile in the action's accent, its icon in the accent's ink, its name
 * beneath in the pill's ink. Drawn the same way in the bar and in the settings preview of it,
 * so what the learner arranges is what the learner gets.
 */
export function SelectToolbarSlot({
  action,
  disabled,
  onClick,
  inert = false,
  className,
}: SelectToolbarSlotProps) {
  const { t } = useTranslation()
  const meta = ACTION_META[action]
  const accent = accentStyleOf(action)
  const label = t(meta.labelKey as never)
  const body = (
    <>
      <span
        aria-hidden
        style={{ '--sw': accent.fill } as CSSProperties}
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-squircle bg-(--sw) shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]',
          accent.ink === 'light' ? 'text-white' : 'text-(--p-navy-900)',
        )}
      >
        {selectActionIcon(action)}
      </span>
      <span className="w-full truncate text-center text-tiny font-semibold text-(--nav-ink)">
        {label}
      </span>
    </>
  )
  const layout =
    'relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control px-0.5'

  if (inert) return <span className={cn(layout, className)}>{body}</span>
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        layout,
        'transition-transform active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
        className,
      )}
    >
      {body}
    </button>
  )
}

/** Slot layout shared with the settings preview: the pill's inner row. */
export function SelectToolbarRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-around gap-1.5 px-4">{children}</div>
  )
}
