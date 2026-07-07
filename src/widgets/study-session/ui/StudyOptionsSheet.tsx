import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Pencil,
  RotateCcw,
  Shuffle,
  Volume2,
  WholeWord,
} from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import { cn } from '@/shared/lib'
import { Button, SegmentedControl, Sheet } from '@/shared/ui'
import { type Scope, type ScopeCounts, scopesEqual } from '@/features/review'
import {
  type FlashcardSwipeAction,
  FLASHCARD_SWIPE_ACTION_META,
  FLASHCARD_SWIPE_ACTIONS,
  type FlashcardSwipeConfig,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { SheetSection } from './SheetSection'
import { ToggleRow } from './ToggleRow'
import type { StudyDirection } from '../model/types'

export interface StudyOptionsSheetProps {
  open: boolean
  onClose: () => void
  scope: Scope
  scopeCounts: ScopeCounts
  /** The active study mode — switched via the header mode button, not here; the sheet only
   * conditions its per-mode sections (swipe map on flip, word spaces on Initials) on it. */
  mode: StudyMode
  direction: StudyDirection
  shuffle: boolean
  textToSpeech: boolean
  canSpeak: boolean
  swipeConfig: FlashcardSwipeConfig
  /** Mark blanks for each hidden letter in Initials mode. Global preference. */
  wordSpaces: boolean
  onScope: (scope: Scope) => void
  onDirection: (direction: StudyDirection) => void
  onShuffle: (value: boolean) => void
  onTextToSpeech: (value: boolean) => void
  onSwipe: (direction: SwipeDirection, action: FlashcardSwipeAction) => void
  onWordSpaces: (value: boolean) => void
  /** Open the in-study editor for the current card; absent when the host can't edit. */
  onEditCard?: () => void
  onRestart: () => void
  onFinish: () => void
}

const DIRECTION_META: {
  direction: SwipeDirection
  icon: ReactNode
  labelKey: string
}[] = [
  { direction: 'up', icon: <ArrowUp className="size-4" aria-hidden />, labelKey: 'study.swipeUp' },
  {
    direction: 'down',
    icon: <ArrowDown className="size-4" aria-hidden />,
    labelKey: 'study.swipeDown',
  },
  {
    direction: 'left',
    icon: <ArrowLeft className="size-4" aria-hidden />,
    labelKey: 'study.swipeLeft',
  },
  {
    direction: 'right',
    icon: <ArrowRight className="size-4" aria-hidden />,
    labelKey: 'study.swipeRight',
  },
]

/** Solid chip register per action when it's the one bound to a direction — the same colour
 * language as the grade buttons and the swipe badges. `none` reads as an explicit "off". */
const ACTION_CHIP_ACTIVE: Record<FlashcardSwipeAction, string> = {
  again: 'bg-[var(--danger)] text-white',
  hard: 'bg-[var(--warning)] text-[var(--warning-on-fill)]',
  good: 'bg-[var(--accent)] text-white',
  easy: 'bg-[var(--success)] text-white',
  flag: 'bg-[var(--rating)] text-[var(--warning-on-fill)]',
  skip: 'bg-[var(--p-gray-500)] text-white',
  none: 'bg-heading/85 text-card',
}

/** The flashcard options sheet: which cards to study (filters), general toggles, card
 * orientation, the active mode's settings (swipe map on flip, word spaces on Initials), and
 * a destructive restart. Every option persists back through the host — palace settings for
 * orientation/shuffle/speech, global preferences for the swipe map and word spaces. The
 * study mode is not here: it switches via the header mode button. */
export function StudyOptionsSheet({
  open,
  onClose,
  scope,
  scopeCounts,
  mode,
  direction,
  shuffle,
  textToSpeech,
  canSpeak,
  swipeConfig,
  wordSpaces,
  onScope,
  onDirection,
  onShuffle,
  onTextToSpeech,
  onSwipe,
  onWordSpaces,
  onEditCard,
  onRestart,
  onFinish,
}: StudyOptionsSheetProps) {
  const { t } = useTranslation()

  const filters: { scope: Scope; label: string; count: number }[] = [
    { scope: { kind: 'all' }, label: t('study.filterAll'), count: scopeCounts.all },
    { scope: { kind: 'due' }, label: t('study.filterDue'), count: scopeCounts.due },
    { scope: { kind: 'new' }, label: t('study.filterNew'), count: scopeCounts.new },
    { scope: { kind: 'learning' }, label: t('study.filterLearning'), count: scopeCounts.learning },
    { scope: { kind: 'flagged' }, label: t('study.filterFlagged'), count: scopeCounts.flagged },
  ]

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('study.optionsTitle')}
      footer={
        <Button
          className="w-full"
          onClick={() => {
            onFinish()
            onClose()
          }}
        >
          <Check className="size-[18px]" aria-hidden />
          {t('study.finish')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <SheetSection title={t('study.cardsToStudy')}>
          <div className="flex flex-wrap gap-2">
            {filters.map(
              ({ scope: candidate, label, count }) =>
                (candidate.kind === 'all' || count > 0) && (
                  <ScopeChip
                    key={candidate.kind}
                    label={label}
                    count={count}
                    active={scopesEqual(scope, candidate)}
                    onClick={() => onScope(candidate)}
                  />
                ),
            )}
          </div>
        </SheetSection>

        <SheetSection title={t('study.general')}>
          <ToggleRow
            icon={<Shuffle className="size-[18px]" aria-hidden />}
            label={t('study.shuffle')}
            description={t('study.shuffleHint')}
            checked={shuffle}
            onChange={onShuffle}
          />
          <ToggleRow
            icon={<Volume2 className="size-[18px]" aria-hidden />}
            label={t('study.textToSpeech')}
            description={canSpeak ? t('study.ttsHint') : t('study.ttsUnsupported')}
            checked={textToSpeech}
            onChange={onTextToSpeech}
            disabled={!canSpeak}
          />
        </SheetSection>

        <SheetSection title={t('study.orientation')}>
          <SegmentedControl
            value={direction}
            options={[
              { value: 'front', label: t('study.orientationTerm') },
              { value: 'back', label: t('study.orientationDefinition') },
            ]}
            onChange={onDirection}
            aria-label={t('study.orientation')}
          />
        </SheetSection>

        {mode === 'flip' ? (
          <SheetSection title={t('study.swipeActionsTitle')}>
            <p className="-mt-1 px-1 text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
              {t('study.swipeActionsHint')}
            </p>
            <div className="flex flex-col gap-2.5">
              {DIRECTION_META.map(({ direction: dir, icon, labelKey }) => (
                <SwipeRow
                  key={dir}
                  icon={icon}
                  label={t(labelKey as never)}
                  selected={swipeConfig[dir]}
                  onSelect={(action) => onSwipe(dir, action)}
                />
              ))}
            </div>
          </SheetSection>
        ) : null}

        {mode === 'initials' ? (
          <SheetSection title={t('study.modeInitials')}>
            <ToggleRow
              icon={<WholeWord className="size-[18px]" aria-hidden />}
              label={t('study.wordSpaces')}
              description={t('study.wordSpacesHint')}
              checked={wordSpaces}
              onChange={onWordSpaces}
            />
          </SheetSection>
        ) : null}

        {onEditCard ? (
          <button
            type="button"
            onClick={() => {
              onEditCard()
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-control bg-info-surface py-3.5 text-(length:--p-text-sub) font-semibold text-heading transition-transform active:scale-[0.99]"
          >
            <Pencil className="size-[18px]" aria-hidden />
            {t('study.editCard')}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            onRestart()
            onClose()
          }}
          className="flex w-full items-center justify-center gap-2 rounded-control bg-[var(--danger-surface)] py-3.5 text-[length:var(--p-text-sub)] font-semibold text-[var(--danger-on-surface)] transition-transform active:scale-[0.99]"
        >
          <RotateCcw className="size-[18px]" aria-hidden />
          {t('study.restartSession')}
        </button>
      </div>
    </Sheet>
  )
}

function ScopeChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[length:var(--p-text-label)] font-semibold transition-transform active:scale-[0.94]',
        active ? 'bg-primary text-primary-foreground' : 'bg-info-surface text-info-foreground',
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'text-[length:var(--p-text-tiny)] font-bold',
            active ? 'opacity-70' : 'opacity-60',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function SwipeRow({
  icon,
  label,
  selected,
  onSelect,
}: {
  icon: ReactNode
  label: string
  selected: FlashcardSwipeAction
  onSelect: (action: FlashcardSwipeAction) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-card bg-info-surface p-3">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-control bg-card text-heading shadow-rest">
          {icon}
        </span>
        <span className="text-[length:var(--p-text-sub)] font-semibold text-heading">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {FLASHCARD_SWIPE_ACTIONS.map((action) => {
          const active = action === selected
          return (
            <button
              key={action}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(action)}
              className={cn(
                'rounded-pill px-3 py-2 text-[length:var(--p-text-label)] font-bold transition-transform active:scale-[0.95]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                active ? ACTION_CHIP_ACTIVE[action] : 'bg-card text-muted-foreground',
              )}
            >
              {t(FLASHCARD_SWIPE_ACTION_META[action].labelKey as never)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
