import { useTranslation } from 'react-i18next'
import type { SelectToolbarConfig } from '@/shared/config/select-toolbar'
import { cn, type MultiSelect } from '@/shared/lib'
import { CloseBadge } from './CloseBadge'
import type { SelectActionHandlers } from './select-actions'
import { SelectToolbarRow } from './SelectToolbarRow'
import { SelectToolbarSlot } from './SelectToolbarSlot'

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
 *
 * An action with no handler is left out — the screen cannot offer it at all. One that has a handler
 * but nothing to act on yet is drawn dimmed, so emptying a tick-box never resizes the bar under
 * the learner's thumb.
 */
export function SelectToolbar({ actions, handlers, selection, className }: SelectToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('relative h-full w-full', className)}>
      <SelectToolbarRow>
        {actions.flatMap((id) => {
          const handler = handlers[id]
          if (!handler) return []
          return [
            <SelectToolbarSlot
              key={id}
              action={id}
              disabled={handler.disabled}
              onClick={handler.onAction}
            />,
          ]
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
