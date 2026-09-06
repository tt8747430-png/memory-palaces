import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Keyboard, Type, WholeWord } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import { Button, Combobox, type ComboboxOption, Sheet, ToggleRow } from '@/shared/ui'
import {
  actionsForMode,
  FLASHCARD_SWIPE_ACTION_META,
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
  quick: QuickActionsModel
  settings: StudySettingsControl
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

/**
 * The card's own settings — what this mode does, what this card does.
 * Study-session-wide settings (filters, orientation, shuffle, TTS…) live in
 * `StudySessionSettingsSheet`, reached from the header.
 */
export function GearSheet({ open, onClose, mode, quick, settings }: GearSheetProps) {
  const { t } = useTranslation()
  const { value, set } = settings

  const actionOptions: ComboboxOption<FlashcardSwipeAction>[] = actionsForMode(mode).map(
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
        // Where the old Finish bar sat. Stopping the study session belongs to
        // `StudySessionSettingsSheet`; what a long options list needs pinned in thumb reach is the
        // way out of it.
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

          <div className="rounded-card bg-info-surface">
            <p className="flex items-center gap-2 px-4 pt-3 text-label text-muted-foreground">
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
                    <span className="text-body font-semibold">{t(labelKey as never)}</span>
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
      </div>
    </Sheet>
  )
}
