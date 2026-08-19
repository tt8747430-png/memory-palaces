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
import type { LearningAlgorithm } from '@/entities/deck'
import type { StudyMode } from '@/entities/preferences'
import { cn, motionSupported, requestMotionPermission } from '@/shared/lib'
import { Button, Combobox, type ComboboxOption, pillSurface, Sheet, ToggleRow } from '@/shared/ui'
import { type StudyFilter, studyFiltersEqual } from '@/features/review'
import {
  actionsForMode,
  FLASHCARD_SWIPE_ACTION_META,
  type FlashcardSwipeAction,
  type SwipeDirection,
} from '@/shared/config/flashcard-swipe'
import { QuickActionRows, type QuickActionsModel } from './QuickActionRows'
import { SheetSection } from './SheetSection'
import type { StudySettingsControl } from '../model/use-study-settings'
import type { StudyDirection } from '../model/types'

export interface GearSheetProps {
  open: boolean
  onClose: () => void
  mode: StudyMode
  algorithm: LearningAlgorithm
  canSpeak: boolean
  quick: QuickActionsModel
  settings: StudySettingsControl
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
  algorithm,
  canSpeak,
  quick,
  settings,
  onFinish,
}: GearSheetProps) {
  const { t } = useTranslation()
  const { value, filterCounts, set } = settings

  const handleShakeToUndo = async (next: boolean) => {
    if (!next) {
      set('shakeToUndo', false)
      return
    }
    const granted = await requestMotionPermission()
    set('shakeToUndo', granted)
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

  // Fast review schedules nothing, so "due" would name a state no card in the session can be in.
  const filterKinds =
    algorithm === 'fast'
      ? (['all', 'new', 'learning', 'flagged'] as const)
      : (['all', 'due', 'new', 'learning', 'flagged'] as const)

  const filters: { filter: StudyFilter; label: string; count: number }[] = filterKinds.map(
    (kind) => ({
      filter: { kind },
      label: t(`study.filter${kind[0]!.toUpperCase()}${kind.slice(1)}` as never),
      count: filterCounts[kind],
    }),
  )

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
          <Check className="size-4.5" aria-hidden />
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
                    value={value.swipe[dir]}
                    options={actionOptions}
                    onChange={(action) => settings.setSwipe(dir, action)}
                  />
                </div>
              ))}
            </div>
          </div>
        </SheetSection>

        <SheetSection title={t('study.session')}>
          <div className="flex flex-wrap gap-2">
            {filters.map(
              ({ filter: candidate, label, count }) =>
                (candidate.kind === 'all' || count > 0) && (
                  <FilterChip
                    key={candidate.kind}
                    label={label}
                    count={count}
                    active={studyFiltersEqual(value.filter, candidate)}
                    onClick={() => set('filter', candidate)}
                  />
                ),
            )}
          </div>

          <PickerRow
            icon={<ArrowLeftRight className="size-4.5" aria-hidden />}
            label={t('study.orientation')}
          >
            <Combobox
              variant="bare"
              label={t('study.orientation')}
              value={value.direction}
              options={orientationOptions}
              onChange={(next) => set('direction', next)}
            />
          </PickerRow>

          <ToggleRow
            icon={<Shuffle className="size-4.5" aria-hidden />}
            label={t('study.shuffle')}
            description={t('study.shuffleHint')}
            checked={value.shuffle}
            onChange={(next) => set('shuffle', next)}
          />
          <ToggleRow
            icon={<Volume2 className="size-4.5" aria-hidden />}
            label={t('study.textToSpeech')}
            description={canSpeak ? t('study.ttsHint') : t('study.ttsUnsupported')}
            checked={value.textToSpeech}
            onChange={(next) => set('textToSpeech', next)}
            disabled={!canSpeak}
          />
          {motionSupported() ? (
            <ToggleRow
              icon={<Smartphone className="size-4.5" aria-hidden />}
              label={t('study.shakeToUndo')}
              description={t('study.shakeToUndoHint')}
              checked={value.shakeToUndo}
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

function FilterChip({
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
        pillSurface(active ? 'primary' : 'info'),
        'transition-transform active:scale-[0.94]',
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'text-(length:--p-text-tiny) font-bold',
            active ? 'opacity-70' : 'opacity-60',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
