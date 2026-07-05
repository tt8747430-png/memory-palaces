import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Blocks,
  Check,
  EyeOff,
  Keyboard,
  Repeat,
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
import type { StudyDirection } from '../model/types'

export interface StudyOptionsSheetProps {
  open: boolean
  onClose: () => void
  scope: Scope
  scopeCounts: ScopeCounts
  mode: StudyMode
  wordSpaces: boolean
  direction: StudyDirection
  shuffle: boolean
  textToSpeech: boolean
  canSpeak: boolean
  swipeConfig: FlashcardSwipeConfig
  onScope: (scope: Scope) => void
  onMode: (mode: StudyMode) => void
  onWordSpaces: (value: boolean) => void
  onDirection: (direction: StudyDirection) => void
  onShuffle: (value: boolean) => void
  onTextToSpeech: (value: boolean) => void
  onSwipe: (direction: SwipeDirection, action: FlashcardSwipeAction) => void
  onRestart: () => void
  onFinish: () => void
}

type ModeMeta = { mode: StudyMode; icon: ReactNode; labelKey: string }

const FLIP_MODE: ModeMeta = {
  mode: 'flip',
  icon: <Repeat className="size-[18px]" aria-hidden />,
  labelKey: 'study.modeFlip',
}

/** One-line description of each mode, shown live under the picker for the selected mode. */
const MODE_HINT: Record<StudyMode, string> = {
  flip: 'study.modeFlipHint',
  type: 'study.modeTypeHint',
  initials: 'study.modeInitialsHint',
  blur: 'study.modeBlurHint',
  words: 'study.modeWordsHint',
}

/** The recall modes that test the answer text before grading, shown below the default Flip. */
const RECALL_MODES: ModeMeta[] = [
  {
    mode: 'type',
    icon: <Keyboard className="size-[18px]" aria-hidden />,
    labelKey: 'study.modeType',
  },
  {
    mode: 'initials',
    icon: <WholeWord className="size-[18px]" aria-hidden />,
    labelKey: 'study.modeInitials',
  },
  {
    mode: 'blur',
    icon: <EyeOff className="size-[18px]" aria-hidden />,
    labelKey: 'study.modeBlur',
  },
  {
    mode: 'words',
    icon: <Blocks className="size-[18px]" aria-hidden />,
    labelKey: 'study.modeWords',
  },
]

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
 * orientation, the four-direction swipe map, and a destructive restart. Every option persists
 * back through the host — palace settings for orientation/shuffle/speech, global preferences
 * for the swipe map. */
export function StudyOptionsSheet({
  open,
  onClose,
  scope,
  scopeCounts,
  mode,
  wordSpaces,
  direction,
  shuffle,
  textToSpeech,
  canSpeak,
  swipeConfig,
  onScope,
  onMode,
  onWordSpaces,
  onDirection,
  onShuffle,
  onTextToSpeech,
  onSwipe,
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
        <Section title={t('study.modeTitle')}>
          <ModeTile
            icon={FLIP_MODE.icon}
            label={t(FLIP_MODE.labelKey as never)}
            active={mode === FLIP_MODE.mode}
            onClick={() => onMode(FLIP_MODE.mode)}
          />
          <div className="grid grid-cols-2 gap-2">
            {RECALL_MODES.map(({ mode: candidate, icon, labelKey }) => (
              <ModeTile
                key={candidate}
                icon={icon}
                label={t(labelKey as never)}
                active={candidate === mode}
                onClick={() => onMode(candidate)}
              />
            ))}
          </div>
          <p className="px-1 text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
            {t(MODE_HINT[mode] as never)}
          </p>
          {mode === 'initials' ? (
            <ToggleRow
              icon={<WholeWord className="size-[18px]" aria-hidden />}
              label={t('study.wordSpaces')}
              description={t('study.wordSpacesHint')}
              checked={wordSpaces}
              onChange={onWordSpaces}
            />
          ) : null}
        </Section>

        <Section title={t('study.cardsToStudy')}>
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
        </Section>

        <Section title={t('study.general')}>
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
        </Section>

        <Section title={t('study.orientation')}>
          <SegmentedControl
            value={direction}
            options={[
              { value: 'front', label: t('study.orientationTerm') },
              { value: 'back', label: t('study.orientationDefinition') },
            ]}
            onChange={onDirection}
            aria-label={t('study.orientation')}
          />
        </Section>

        {mode === 'flip' ? (
          <Section title={t('study.swipeActionsTitle')}>
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
          </Section>
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

function ModeTile({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex min-h-[48px] items-center justify-center gap-2 rounded-card px-3 py-3 transition-transform active:scale-[0.97]',
        'text-[length:var(--p-text-sub)] font-semibold',
        active
          ? 'bg-primary text-primary-foreground shadow-interactive'
          : 'bg-info-surface text-heading',
      )}
    >
      <span className={cn('shrink-0', active ? 'text-primary-foreground' : 'text-primary')}>
        {icon}
      </span>
      {label}
    </button>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[length:var(--p-text-label)] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
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

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: ReactNode
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-3 text-left transition-transform active:scale-[0.99]',
        disabled && 'opacity-50',
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-heading">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
            {label}
          </span>
          {description && (
            <span className="mt-0.5 block text-[length:var(--p-text-label)] leading-snug text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      </span>
      <span
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-[color-mix(in_oklch,var(--text-muted)_32%,transparent)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 block size-6 rounded-full bg-card shadow-rest transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}
