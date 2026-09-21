import { useTranslation } from 'react-i18next'
import { ACTION_META } from '@/shared/config/actions'
import type { SelectToolbarConfig } from '@/shared/config/select-toolbar'
import { cn, type MultiSelect } from '@/shared/lib'
import { DockPill } from './BottomDock'
import { CloseBadge } from './CloseBadge'
import { type SelectActionHandlers, selectActionIcon } from './select-actions'

export interface SelectToolbarProps {
  actions: SelectToolbarConfig
  handlers: SelectActionHandlers
  selection: Pick<MultiSelect, 'exit'>
  className?: string
}

/**
 * The bottom slot, while a selection is on. It is the nav's box and the nav's material: four slots
 * of 51px inside the 16rem pill, each an icon over a label, exactly as a tab is. Swapping one for
 * the other is then a change of contents, not of furniture.
 */
export function SelectToolbar({ actions, handlers, selection, className }: SelectToolbarProps) {
  const { t } = useTranslation()
  const shown = actions.filter((id) => handlers[id] != null)

  return (
    <div className="relative h-full w-full">
      <DockPill className={cn('justify-around gap-1.5 px-4', className)}>
        {shown.map((id) => {
          const meta = ACTION_META[id]
          const handler = handlers[id]!
          return (
            <button
              key={id}
              type="button"
              onClick={handler.onAction}
              disabled={handler.disabled}
              className={cn(
                'relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1',
                'rounded-control px-0.5',
                'transition-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
                meta.destructive ? 'text-(--danger-on-surface)' : 'text-(--nav-ink)',
              )}
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-squircle',
                  meta.destructive ? 'bg-(--danger-surface)' : null,
                )}
              >
                {selectActionIcon(id)}
              </span>
              <span className="w-full truncate text-center text-tiny font-semibold">
                {t(meta.labelKey as never)}
              </span>
            </button>
          )
        })}
      </DockPill>
      {/* Outside the pill, which clips to its corners — the badge hangs off one. Last in the
          tree so it paints over the slot beneath it. */}
      <CloseBadge
        size="md"
        corner="start"
        label={t('selection.exitSelectMode')}
        onClick={selection.exit}
      />
    </div>
  )
}
