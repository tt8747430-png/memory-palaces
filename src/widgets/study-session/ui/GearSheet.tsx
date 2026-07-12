import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Check,
  Keyboard,
  Shuffle,
  Smartphone,
  Type,
  Volume2,
  WholeWord,
} from 'lucide-react'
import { toast } from 'sonner'
import type { StudyMode } from '@/entities/preferences'
import { cn, motionSupported, requestMotionPermission } from '@/shared/lib'
import { Button, Combobox, type ComboboxOption, Sheet } from '@/shared/ui'
import { type Scope, type ScopeCounts, scopesEqual } from '@/features/review'
import {
  actionsForMode,
  type FlashcardSwipeAction,
  type FlashcardSwipeConfig,
  FLASHCARD_SWIPE_ACTION_META,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { QuickActionRows, type QuickActionsModel } from './QuickActionRows'
import { SheetSection } from './SheetSection'
import { ToggleRow } from './ToggleRow'
import type { StudyDirection } from '../model/types'

export interface GearSheetProps {
  open: boolean
  onClose: () => void
  mode: StudyMode
  canSpeak: boolean
  quick: QuickActionsModel
  typeInitialsOnly: boolean
  onTypeInitialsOnly: (value: boolean) => void
  wordSpaces: boolean
  onWordSpaces: (value: boolean) => void
  swipeConfig: FlashcardSwipeConfig
  onSwipe: (direction: SwipeDirection, action: FlashcardSwipeAction) => void
  scope: Scope
  scopeCounts: ScopeCounts
  onScope: (scope: Scope) => void
  shuffle: boolean
  onShuffle: (value: boolean) => void
  textToSpeech: boolean
  onTextToSpeech: (value: boolean) => void
  shakeToUndo: boolean
  onShakeToUndo: (value: boolean) => void
  direction: StudyDirection
  onDirection: (direction: StudyDirection) => void
  onFinish: () => void
}

const DIRECTION_META: { direction: SwipeDirection; icon: ReactNode; labelKey: string }[] = [
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

export function GearSheet({
  open,
  onClose,
  mode,
  canSpeak,
  quick,
  typeInitialsOnly,
  onTypeInitialsOnly,
  wordSpaces,
  onWordSpaces,
  swipeConfig,
  onSwipe,
  scope,
  scopeCounts,
  onScope,
  shuffle,
  onShuffle,
  textToSpeech,
  onTextToSpeech,
  shakeToUndo,
  onShakeToUndo,
  direction,
  onDirection,
  onFinish,
}: GearSheetProps) {
  const { t } = useTranslation()

  const handleShakeToUndo = async (value: boolean) => {
    if (!value) {
      onShakeToUndo(false)
      return
    }
    const granted = await requestMotionPermission()
    onShakeToUndo(granted)
    if (!granted) toast(t('study.shakeUnsupported'))
  }

  const actionOptions: ComboboxOption<FlashcardSwipeAction>[] = actionsForMode(mode).map(
    (action) => ({
      value: action,
      label: t(FLASHCARD_SWIPE_ACTION_META[action].labelKey as never),
    }),
  )

  const orientationOptions: ComboboxOption<StudyDirection>[] = [
    { value: 'front', label: t('study.orientationTerm') },
    { value: 'back', label: t('study.orientationDefinition') },
  ]

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
        <SheetSection title={t('study.thisCard')}>
          <QuickActionRows model={quick} after={onClose} />
        </SheetSection>

        <SheetSection title={t('study.thisMode')}>
          {mode === 'type' ? (
            <ToggleRow
              icon={<Type className="size-[18px]" aria-hidden />}
              label={t('study.typeInitialsOnly')}
              description={t('study.typeInitialsHint')}
              checked={typeInitialsOnly}
              onChange={onTypeInitialsOnly}
            />
          ) : null}
          {mode === 'initials' ? (
            <ToggleRow
              icon={<WholeWord className="size-[18px]" aria-hidden />}
              label={t('study.wordSpaces')}
              description={t('study.wordSpacesHint')}
              checked={wordSpaces}
              onChange={onWordSpaces}
            />
          ) : null}

          <div className="rounded-card bg-info-surface">
            <p className="flex items-center gap-2 px-4 pt-3 text-(length:--p-text-label) text-muted-foreground">
              <Keyboard className="size-4 shrink-0" aria-hidden />
              {t('study.swipeActionsHint')}
            </p>
            <div className="divide-y divide-border/60">
              {DIRECTION_META.map(({ direction: dir, icon, labelKey }) => (
                <div key={dir} className="flex items-center justify-between gap-3 px-4 py-1.5">
                  <span className="flex items-center gap-2.5 text-heading">
                    <span className="grid size-7 shrink-0 place-items-center rounded-control bg-card text-heading shadow-rest">
                      {icon}
                    </span>
                    <span className="text-(length:--p-text-sub) font-semibold">
                      {t(labelKey as never)}
                    </span>
                  </span>
                  <Combobox
                    variant="bare"
                    label={t(labelKey as never)}
                    value={swipeConfig[dir]}
                    options={actionOptions}
                    onChange={(action) => onSwipe(dir, action)}
                  />
                </div>
              ))}
            </div>
          </div>
        </SheetSection>

        <SheetSection title={t('study.session')}>
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

          <PickerRow
            icon={<ArrowLeftRight className="size-[18px]" aria-hidden />}
            label={t('study.orientation')}
          >
            <Combobox
              variant="bare"
              label={t('study.orientation')}
              value={direction}
              options={orientationOptions}
              onChange={onDirection}
            />
          </PickerRow>

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
          {motionSupported() ? (
            <ToggleRow
              icon={<Smartphone className="size-[18px]" aria-hidden />}
              label={t('study.shakeToUndo')}
              description={t('study.shakeToUndoHint')}
              checked={shakeToUndo}
              onChange={handleShakeToUndo}
            />
          ) : null}
        </SheetSection>
      </div>
    </Sheet>
  )
}

function PickerRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-info-surface px-4 py-2.5">
      <span className="flex min-w-0 items-center gap-3 text-heading">
        <span className="shrink-0">{icon}</span>
        <span className="truncate text-(length:--p-text-sub) font-semibold">{label}</span>
      </span>
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
