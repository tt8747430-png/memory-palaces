import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftRight, Shuffle, Smartphone, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import type { LearningAlgorithm } from '@/entities/deck'
import { motionSupported, requestMotionPermission } from '@/shared/lib'
import { Button, Combobox, type ComboboxOption, Sheet, ToggleRow } from '@/shared/ui'
import { FinishStudySessionButton } from './FinishStudySessionButton'
import { StudyFilterChips } from './StudyFilterChips'
import type { StudyDirection } from '../model/types'
import type { StudySettingsControl } from '../model/use-study-settings'

export interface StudySessionSettingsSheetProps {
  open: boolean
  onClose: () => void
  algorithm: LearningAlgorithm
  canSpeak: boolean
  settings: StudySettingsControl
  onFinish: () => void
}

/**
 * Settings for the study session as a whole — which cards are in it, which way round, shuffled or
 * not — as opposed to `GearSheet`'s this-card/this-mode settings. Reached from the study header,
 * not the card, because none of it is about the card currently on screen.
 */
export function StudySessionSettingsSheet({
  open,
  onClose,
  algorithm,
  canSpeak,
  settings,
  onFinish,
}: StudySessionSettingsSheetProps) {
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

  const orientationOptions: ComboboxOption<StudyDirection>[] = [
    { value: 'front', label: t('study.orientationTerm') },
    { value: 'back', label: t('study.orientationDefinition') },
  ]

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t('study.studySessionSettingsTitle')}
      footer={
        // The bar is a dismiss, not a decision: stopping the study session is a deliberate button
        // above, so the one thing pinned in thumb reach is the harmless way out of a tall sheet.
        <Button variant="secondary" className="w-full" onClick={onClose}>
          {t('study.closeSettings')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <StudyFilterChips
          algorithm={algorithm}
          counts={filterCounts}
          value={value.filter}
          onPick={(filter) => set('filter', filter)}
        />

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

        <FinishStudySessionButton
          onFinish={() => {
            onFinish()
            onClose()
          }}
        />
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
