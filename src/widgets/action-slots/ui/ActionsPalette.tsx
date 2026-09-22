import { useTranslation } from 'react-i18next'
import { Check, Plus } from 'lucide-react'
import { ACTION_META, type ActionId } from '@/shared/config/actions'
import { cn } from '@/shared/lib'
import { ActionFace } from './ActionFace'

export interface ActionsPaletteProps<T extends ActionId> {
  label: string
  /** Every action this surface could take, in a stable order — on the strip or not. */
  actions: readonly T[]
  /** The ones on the strip right now. */
  placed: readonly T[]
  /** Whether one more would fit. */
  hasRoom: boolean
  /** Whether what is on may come off. Left off, it always may — the select bar keeps its last. */
  canRemove?: boolean
  onAdd: (id: T) => void
  onRemove: (id: T) => void
  /** One line under the row: how to arrange what is on, or why nothing more will go on. */
  hint: string
}

const TILE =
  'flex w-16 shrink-0 snap-start flex-col items-center gap-1 rounded-tile pt-1.5 ' +
  'transition-[transform,opacity] hover:opacity-85 active:scale-[0.94] ' +
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 ' +
  'disabled:pointer-events-none disabled:opacity-40'

/** The corner mark: what a tap would do, in a shape as well as a colour. */
const MARK =
  'absolute -right-1.5 -top-1.5 grid size-4.5 place-items-center rounded-full shadow-rest [&_svg]:size-2.5'

/**
 * Every action this surface has, in one row, each one a switch: on means it is on the strip, off
 * means a tap would put it there. Nothing is hidden behind anything, and a longer list scrolls
 * sideways rather than wrapping into a grid that reads as a second strip.
 *
 * It replaced a sheet that listed the actions not yet in use. The sheet was honest but it put the
 * choice one press away and out of sight of the strip it was about, so arranging four actions meant
 * opening and closing it four times — and an action already in use simply vanished from the list
 * rather than showing itself as already on.
 *
 * Order is the strip's business, not this row's: this says *which*, the bar above says *where*.
 */
export function ActionsPalette<T extends ActionId>({
  label,
  actions,
  placed,
  hasRoom,
  canRemove = true,
  onAdd,
  onRemove,
  hint,
}: ActionsPaletteProps<T>) {
  const { t } = useTranslation()
  const on = new Set(placed)

  return (
    <section className="flex flex-col gap-2">
      <span className="px-1 text-label font-bold text-heading">{label}</span>

      {/* Bleeds to the card's edges so a tile scrolling off reads as "more this way", not as cut. */}
      <div className="scrollbar-hide -mx-3.5 flex snap-x scroll-px-3.5 gap-1 overflow-x-auto px-3.5 pb-0.5">
        {actions.map((id) => {
          const isOn = on.has(id)
          return (
            <button
              key={id}
              type="button"
              // Named by the action alone: the switch's own state says whether it is on, and the
              // strip's badges already own "Remove …".
              role="switch"
              aria-checked={isOn}
              disabled={isOn ? !canRemove : !hasRoom}
              onClick={() => (isOn ? onRemove(id) : onAdd(id))}
              className={TILE}
            >
              <ActionFace action={id} off={!isOn}>
                <span
                  aria-hidden
                  className={cn(
                    MARK,
                    isOn ? 'bg-heading text-(--surface)' : 'bg-card text-muted-foreground',
                  )}
                >
                  {isOn ? <Check strokeWidth={3.5} /> : <Plus strokeWidth={3.5} />}
                </span>
              </ActionFace>
              <span
                className={cn(
                  'w-full truncate text-center text-tiny font-semibold',
                  isOn ? 'text-heading' : 'text-muted-foreground',
                )}
              >
                {t(ACTION_META[id].labelKey as never)}
              </span>
            </button>
          )
        })}
      </div>

      <p className="px-1 text-tiny leading-snug text-muted-foreground">{hint}</p>
    </section>
  )
}
