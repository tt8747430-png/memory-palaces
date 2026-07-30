import type { ReactNode } from 'react'
import { ACTION_META } from '@/shared/config/actions'
import { useTranslation } from 'react-i18next'
import {
  SWIPE_ACTIONS,
  SWIPE_SIDE_MAX,
  type SwipeActionId,
  type SwipeConfig,
  type SwipeItemType,
} from '@/shared/config/swipe'
import { ActionPill, SlotCount, swipeActionIcon } from '@/shared/ui'
import { accentOf } from './swipe-accent'

export interface SideGroupProps {
  icon: ReactNode
  label: string
  side: keyof SwipeConfig
  type: SwipeItemType
  selected: SwipeActionId[]
  onToggle: (id: SwipeActionId) => void
}

export function SideGroup({ icon, label, side, type, selected, onToggle }: SideGroupProps) {
  const { t } = useTranslation()
  const max = SWIPE_SIDE_MAX[side]
  const atCap = selected.length >= max

  return (
    <div className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-(length:--p-text-label) font-bold text-heading">
          <span className="grid size-5 place-items-center rounded-md bg-primary/[0.07] text-primary">
            {icon}
          </span>
          {label}
        </span>
        <SlotCount full={atCap}>{t('swipe.sideCount', { count: selected.length, max })}</SlotCount>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5" data-swipe-side={side}>
        {SWIPE_ACTIONS[type].map((id) => {
          const on = selected.includes(id)
          return (
            <ActionPill
              key={id}
              label={t(ACTION_META[id].labelKey as never)}
              icon={swipeActionIcon(id)}
              accent={accentOf(id).fill}
              on={on}
              disabled={!on && atCap}
              aria-pressed={on}
              onClick={() => onToggle(id)}
            />
          )
        })}
      </div>
    </div>
  )
}
