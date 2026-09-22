import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ACTION_META } from '@/shared/config/actions'
import {
  SWIPE_ACTIONS,
  SWIPE_SIDE_MAX,
  type SwipeActionId,
  type SwipeConfig,
  type SwipeItemType,
  withoutSwipeAction,
} from '@/shared/config/swipe'
import { cn } from '@/shared/lib'
import { ActionPill, cardSurface, SegmentedControl, SlotCount, swipeActionIcon } from '@/shared/ui'
import { accentOf } from './swipe-accent'

type Side = keyof SwipeConfig

const SIDES: readonly Side[] = ['leading', 'trailing']

const SIDE_ICON: Record<Side, typeof ArrowRight> = { leading: ArrowRight, trailing: ArrowLeft }
const SIDE_MARK: Record<Side, string> = { leading: '→', trailing: '←' }

export interface ActionPaletteProps {
  type: SwipeItemType
  config: SwipeConfig
  onChange: (next: SwipeConfig) => void
}

const sideOf = (config: SwipeConfig, id: SwipeActionId): Side | null =>
  config.leading.includes(id) ? 'leading' : config.trailing.includes(id) ? 'trailing' : null

/**
 * Every action a row of this kind offers, listed once. A chip on a rail wears the arrow of its
 * side; tapping it takes it off. A chip on no rail joins the side picked above — so the two rails
 * share one list instead of each repeating it, and an action is never offered twice.
 */
export function ActionPalette({ type, config, onChange }: ActionPaletteProps) {
  const { t } = useTranslation()
  const [target, setTarget] = useState<Side>('leading')
  const full = config[target].length >= SWIPE_SIDE_MAX[target]

  const toggle = (id: SwipeActionId) => {
    const without = withoutSwipeAction(config, id)
    if (sideOf(config, id)) {
      onChange(without)
      return
    }
    if (full) return
    onChange({ ...without, [target]: [...without[target], id] })
  }

  return (
    <section className={cn(cardSurface, 'flex flex-col gap-3 p-3.5')}>
      <span className="text-label font-bold text-heading">{t('swipe.addTo')}</span>
      {/* One clear target, the width of the card: the side a tapped chip joins. Each half says
          which swipe it is, in which direction, and how much room is left on it. */}
      <SegmentedControl
        aria-label={t('swipe.addTo')}
        value={target}
        onChange={setTarget}
        options={SIDES.map((side) => {
          const Icon = SIDE_ICON[side]
          const count = config[side].length
          const max = SWIPE_SIDE_MAX[side]
          return {
            value: side,
            ariaLabel: `${t(`swipe.${side}`)} ${t('swipe.sideCount', { count, max })}`,
            label: (
              <span className="flex flex-col items-center gap-1 py-0.5">
                <span className="flex items-center gap-1.5">
                  <Icon className="size-4.5" aria-hidden />
                  {t(`swipe.${side}`)}
                </span>
                <SlotCount full={count >= max}>{t('swipe.sideCount', { count, max })}</SlotCount>
              </span>
            ),
          }
        })}
      />

      <div className="flex flex-wrap gap-1.5">
        {SWIPE_ACTIONS[type].map((id) => {
          const side = sideOf(config, id)
          return (
            <ActionPill
              key={id}
              label={t(ACTION_META[id].labelKey as never)}
              icon={swipeActionIcon(id)}
              accent={accentOf(id).fill}
              on={side !== null}
              disabled={side === null && full}
              aria-pressed={side !== null}
              aria-label={t(ACTION_META[id].labelKey as never)}
              onClick={() => toggle(id)}
              trailing={
                side ? (
                  <span aria-hidden className="text-tiny font-bold">
                    {SIDE_MARK[side]}
                  </span>
                ) : null
              }
            />
          )
        })}
      </div>

      <p className="text-tiny leading-snug text-muted-foreground">
        {full ? t('swipe.sideFull', { side: t(`swipe.${target}`) }) : t('swipe.paletteHint')}
      </p>
    </section>
  )
}
