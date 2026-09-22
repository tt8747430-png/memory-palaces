import { useTranslation } from 'react-i18next'
import { Pointer, Type, WholeWord } from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'
import type { StudyMode } from '@/entities/preferences'
import { Button, Sheet, ToggleRow } from '@/shared/ui'
import { QuickActionRows, type QuickActionsModel } from './QuickActionRows'
import { SheetSection } from './SheetSection'
import { ZoneActionRows } from './ZoneActionRows'
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

export function GearSheet({ open, onClose, mode, algorithm, quick, settings }: GearSheetProps) {
  const { t } = useTranslation()
  const { value, set } = settings

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
              surface="tint"
              icon={<Type className="size-4.5" aria-hidden />}
              label={t('study.typeInitialsOnly')}
              description={t('study.typeInitialsHint')}
              checked={value.typeInitialsOnly}
              onChange={(next) => set('typeInitialsOnly', next)}
            />
          ) : null}
          {mode === 'initials' ? (
            <ToggleRow
              surface="tint"
              icon={<WholeWord className="size-4.5" aria-hidden />}
              label={t('study.wordSpaces')}
              description={t('study.wordSpacesHint')}
              checked={value.wordSpaces}
              onChange={(next) => set('wordSpaces', next)}
            />
          ) : null}

          <ToggleRow
            surface="tint"
            icon={<Pointer className="size-4.5" aria-hidden />}
            label={t('study.tapToAnswer')}
            description={t('study.tapToAnswerHint')}
            checked={value.flashcardInput === 'tap'}
            onChange={(next) => set('flashcardInput', next ? 'tap' : 'swipe')}
          />

          <ZoneActionRows
            mode={mode}
            algorithm={algorithm}
            input={value.flashcardInput}
            swipe={value.swipe}
            onSet={settings.setSwipe}
          />
        </SheetSection>
      </div>
    </Sheet>
  )
}
