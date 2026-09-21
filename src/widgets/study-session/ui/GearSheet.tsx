import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Keyboard,
  Pointer,
  Type,
  WholeWord,
} from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'
import type { StudyMode } from '@/entities/preferences'
import { Button, Combobox, type ComboboxOption, Sheet, ToggleRow } from '@/shared/ui'
import {
  actionsFor,
  FLASHCARD_SWIPE_ACTION_META,
  type FlashcardInput,
  type FlashcardSwipeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { QuickActionRows, type QuickActionsModel } from './QuickActionRows'
import { SheetSection } from './SheetSection'
import type { StudySettingsControl } from '../model/use-study-settings'

export interface GearSheetProps {
  open: boolean
  onClose: () => void
  mode: StudyMode
  /** The Deck's Learning algorithm: a Fast review offers its two answers, never the four Grades. */
  algorithm: LearningAlgorithm
  quick: QuickActionsModel
  settings: StudySettingsControl
}

interface DirectionMeta {
  direction: SwipeDirection
  icon: ReactNode
  /** The same direction, named for how the setting is given — thrown or tapped. */
  labelKey: Record<FlashcardInput, string>
}

const DIRECTION_META: DirectionMeta[] = [
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

export function GearSheet({ open, onClose, mode, algorithm, quick, settings }: GearSheetProps) {
  const { t } = useTranslation()
  const { value, set } = settings

  const actionOptions: ComboboxOption<FlashcardSwipeAction>[] = actionsFor(algorithm, mode).map(
    (action) => ({
      value: action,
      label: t(FLASHCARD_SWIPE_ACTION_META[action].labelKey as never),
    }),
  )

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('study.optionsTitle')}
      footer={
        <Button variant="secondary" className="w-full" onClick={onClose}>
          {t('study.closeSettings')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <SheetSection title={t('study.thisCard')}>
          <QuickActionRows model={quick} after={onClose} />
        </SheetSection>

        <SheetSection title={t('study.thisMode')}>
          {mode === 'type' ? (
            <ToggleRow
              icon={<Type className="size-4.5" aria-hidden />}
              label={t('study.typeInitialsOnly')}
              description={t('study.typeInitialsHint')}
              checked={value.typeInitialsOnly}
              onChange={(next) => set('typeInitialsOnly', next)}
            />
          ) : null}
          {mode === 'initials' ? (
            <ToggleRow
              icon={<WholeWord className="size-4.5" aria-hidden />}
              label={t('study.wordSpaces')}
              description={t('study.wordSpacesHint')}
              checked={value.wordSpaces}
              onChange={(next) => set('wordSpaces', next)}
            />
          ) : null}

          <ToggleRow
            icon={<Pointer className="size-4.5" aria-hidden />}
            label={t('study.tapToAnswer')}
            description={t('study.tapToAnswerHint')}
            checked={value.flashcardInput === 'tap'}
            onChange={(next) => set('flashcardInput', next ? 'tap' : 'swipe')}
          />

          <div className="rounded-card bg-info-surface">
            <p className="flex items-center gap-2 px-4 pt-3 text-label text-muted-foreground">
              <Keyboard className="size-4 shrink-0" aria-hidden />
              {t(
                value.flashcardInput === 'tap'
                  ? (`study.tapActionsHint.${algorithm}` as never)
                  : (`study.swipeActionsHint.${algorithm}` as never),
              )}
            </p>
            <div className="divide-y divide-border/60">
              {DIRECTION_META.map(({ direction: dir, icon, labelKey }) => {
                const label = t(labelKey[value.flashcardInput] as never)
                return (
                  <div key={dir} className="flex items-center justify-between gap-3 px-4 py-1.5">
                    <span className="flex items-center gap-2.5 text-heading">
                      <span className="grid size-7 shrink-0 place-items-center rounded-control bg-card text-heading shadow-rest">
                        {icon}
                      </span>
                      <span className="text-body font-semibold">{label}</span>
                    </span>
                    <Combobox
                      variant="bare"
                      label={label}
                      value={value.swipe[dir]}
                      options={actionOptions}
                      onChange={(action) => settings.setSwipe(dir, action)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </SheetSection>
      </div>
    </Sheet>
  )
}
