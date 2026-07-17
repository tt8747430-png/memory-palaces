import { useTranslation } from 'react-i18next'
import { SELECT_ACTION_META, type SelectToolbarConfig } from '@/shared/config/select-toolbar'
import { cn } from '@/shared/lib'
import { type SelectActionHandlers, selectActionIcon } from './select-actions'

export interface SelectToolbarProps {
  /** The learner's configured bar for this surface, in order. */
  actions: SelectToolbarConfig
  handlers: SelectActionHandlers
  className?: string
}

/**
 * The bar that a multi-selection acts through. Which actions it carries is the
 * learner's choice (Settings → Select toolbar); everything here stays neutral so
 * a four-action bar reads as one calm surface, with only a destructive action
 * allowed to raise its voice.
 */
export function SelectToolbar({ actions, handlers, className }: SelectToolbarProps) {
  const { t } = useTranslation()
  const shown = actions.filter((id) => handlers[id] != null)
  if (shown.length === 0) return null

  return (
    <div
      className={cn(
        'flex items-stretch gap-1.5 rounded-card-featured bg-card/95 p-2 shadow-elevated backdrop-blur-xl',
        className,
      )}
    >
      {shown.map((id) => {
        const meta = SELECT_ACTION_META[id]
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
                ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]'
                : 'bg-info-surface text-heading',
            )}
          >
            {selectActionIcon(id)}
            <span className="w-full truncate text-center text-[length:var(--ms-text-tiny)] font-semibold">
              {t(meta.labelKey as never)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
