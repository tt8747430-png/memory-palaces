import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Keyboard, SquareDot } from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'
import type { StudyMode } from '@/entities/preferences'
import { Combobox, type ComboboxOption } from '@/shared/ui'
import {
  actionsFor,
  CENTRE_TAP_ACTION_META,
  type CentreTapAction,
  centreActionsFor,
  FLASHCARD_SWIPE_ACTION_META,
  type FlashcardInput,
  type FlashcardSwipeAction,
  type FlashcardSwipeConfig,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import type { StudySettingsControl } from '../model/use-study-settings'

interface DirectionMeta {
  direction: SwipeDirection
  icon: ReactNode
  /** The same direction, named for how the setting is given — thrown or tapped. */
  labelKey: Record<FlashcardInput, string>
}

const DIRECTION_META: readonly DirectionMeta[] = [
  {
    direction: 'up',
    icon: <ArrowUp className="size-4" aria-hidden />,
    labelKey: { swipe: 'study.swipeUp', tap: 'study.tapUp' },
  },
  {
    direction: 'down',
    icon: <ArrowDown className="size-4" aria-hidden />,
    labelKey: { swipe: 'study.swipeDown', tap: 'study.tapDown' },
  },
  {
    direction: 'left',
    icon: <ArrowLeft className="size-4" aria-hidden />,
    labelKey: { swipe: 'study.swipeLeft', tap: 'study.tapLeft' },
  },
  {
    direction: 'right',
    icon: <ArrowRight className="size-4" aria-hidden />,
    labelKey: { swipe: 'study.swipeRight', tap: 'study.tapRight' },
  },
]

export interface ZoneActionRowsProps {
  mode: StudyMode
  /** The Deck's Learning algorithm: a Fast review offers its two answers, never the four Grades. */
  algorithm: LearningAlgorithm
  input: FlashcardInput
  swipe: FlashcardSwipeConfig
  /** The setting's own overloaded writer: an edge takes an answer, the centre may also flip. */
  onSet: StudySettingsControl['setSwipe']
}

/**
 * What each zone of the card does: the four edges, and — only when answers are tapped — the
 * middle of the revealed side. One row per zone, each a picker of the actions this mode and
 * algorithm allow. The sibling of `QuickActionRows` in the gear sheet.
 */
export function ZoneActionRows({ mode, algorithm, input, swipe, onSet }: ZoneActionRowsProps) {
  const { t } = useTranslation()
  const tapping = input === 'tap'

  const actionOptions: ComboboxOption<FlashcardSwipeAction>[] = actionsFor(algorithm, mode).map(
    (action) => ({
      value: action,
      label: t(FLASHCARD_SWIPE_ACTION_META[action].labelKey as never),
    }),
  )
  const centreOptions: ComboboxOption<CentreTapAction>[] = centreActionsFor(algorithm, mode).map(
    (action) => ({
      value: action,
      label: t(CENTRE_TAP_ACTION_META[action].labelKey as never),
    }),
  )

  return (
    <div className="rounded-card bg-info-surface">
      <p className="flex items-center gap-2 px-4 pt-3 text-label text-muted-foreground">
        <Keyboard className="size-4 shrink-0" aria-hidden />
        {t(
          tapping
            ? (`study.tapActionsHint.${algorithm}` as never)
            : (`study.swipeActionsHint.${algorithm}` as never),
        )}
      </p>
      <div className="divide-y divide-border/60">
        {DIRECTION_META.map(({ direction, icon, labelKey }) => {
          const label = t(labelKey[input] as never)
          return (
            <ZoneRow key={direction} icon={icon} label={label}>
              <Combobox
                variant="bare"
                label={label}
                value={swipe[direction]}
                options={actionOptions}
                onChange={(action) => onSet(direction, action)}
              />
            </ZoneRow>
          )
        })}
        {/* Only a tap has a middle worth setting: a fling from the middle is a fling. On the
            prompt side the middle always turns the card over; this row is the revealed side. */}
        {tapping ? (
          <ZoneRow
            icon={<SquareDot className="size-4" aria-hidden />}
            label={t('study.tapCentre')}
            description={t('study.tapCentreHint')}
          >
            <Combobox
              variant="bare"
              label={t('study.tapCentre')}
              value={swipe.centre}
              options={centreOptions}
              onChange={(action) => onSet('centre', action)}
            />
          </ZoneRow>
        ) : null}
      </div>
    </div>
  )
}

function ZoneRow({
  icon,
  label,
  description,
  children,
}: {
  icon: ReactNode
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-1.5">
      <span className="flex min-w-0 items-center gap-2.5 text-heading">
        <span className="grid size-7 shrink-0 place-items-center rounded-control bg-card text-heading shadow-rest">
          {icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-body font-semibold">{label}</span>
          {description ? (
            <span className="text-tiny leading-snug text-muted-foreground">{description}</span>
          ) : null}
        </span>
      </span>
      {children}
    </div>
  )
}
