import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { ACTION_META } from '@/shared/config/actions'
import type { SelectToolbarConfig } from '@/shared/config/select-toolbar'
import { cn, type MultiSelect } from '@/shared/lib'
import { IconButton } from './primitives'
import { type SelectActionHandlers, selectActionIcon } from './select-actions'

export interface SelectToolbarProps {
  actions: SelectToolbarConfig
  handlers: SelectActionHandlers
  /**
   * The live selection — the toolbar ends it, the same way `SelectHeader` takes the selection it
   * counts. Leaving select mode sits beside the actions so it is in reach with them, not only up in
   * the header.
   */
  selection: Pick<MultiSelect, 'exit'>
  className?: string
}

export function SelectToolbar({ actions, handlers, selection, className }: SelectToolbarProps) {
  const { t } = useTranslation()
  const shown = actions.filter((id) => handlers[id] != null)

  return (
    <div
      className={cn(
        'flex items-stretch gap-1.5 rounded-card-featured bg-card/95 p-2 shadow-elevated backdrop-blur-xl',
        className,
      )}
    >
      <IconButton
        variant="tint"
        // Not "Cancel": the header already offers one by that name, and two controls sharing a name
        // on one screen leaves a screen reader with no way to tell them apart.
        aria-label={t('selection.exitSelectMode')}
        onClick={selection.exit}
        className="focus-visible:ring-[3px] focus-visible:ring-primary/40"
      >
        <X className="size-4.5" aria-hidden />
      </IconButton>
      {shown.length > 0 ? <div className="my-1 w-px shrink-0 bg-border" aria-hidden /> : null}
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
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control px-1 py-2',
              'transition-transform active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
              meta.destructive
                ? 'bg-(--danger-surface) text-(--danger-on-surface)'
                : 'bg-info-surface text-heading',
            )}
          >
            {selectActionIcon(id)}
            <span className="w-full truncate text-center text-(length:--p-text-tiny) font-semibold">
              {t(meta.labelKey as never)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
