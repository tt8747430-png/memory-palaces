import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { STUDY_MODES, type StudyMode } from '@/entities/preferences'
import { cn } from '@/shared/lib'
import { Sheet } from '@/shared/ui'
import { STUDY_MODE_META } from './mode-meta'
import { SheetSection } from './SheetSection'

export interface ModeSheetProps {
  open: boolean
  onClose: () => void
  mode: StudyMode
  onMode: (mode: StudyMode) => void
}

/** The study-mode picker, split the way the modes actually differ: the Classic flashcard
 * on its own, then the recall-practice ladder (Blur → Rebuild → Initials → Type) in the
 * `STUDY_MODES` order. One row per mode (icon + name + one-line hint), the active one
 * filled navy and checked. Picking a row switches the live session and closes the sheet;
 * per-mode settings live in the options sheet, not here. */
export function ModeSheet({ open, onClose, mode, onMode }: ModeSheetProps) {
  const { t } = useTranslation()
  const recallModes = STUDY_MODES.filter((candidate) => candidate !== 'flip')

  const modeRow = (candidate: StudyMode) => {
    const { Icon, labelKey, hintKey } = STUDY_MODE_META[candidate]
    const active = candidate === mode
    return (
      <button
        key={candidate}
        type="button"
        aria-pressed={active}
        onClick={() => {
          onMode(candidate)
          onClose()
        }}
        className={cn(
          'flex w-full items-center gap-3.5 rounded-card p-3.5 text-left transition-transform active:scale-[0.99]',
          active ? 'bg-primary text-primary-foreground shadow-interactive' : 'bg-info-surface',
        )}
      >
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-control',
            active ? 'bg-white/15 text-primary-foreground' : 'bg-card text-primary shadow-rest',
          )}
          aria-hidden
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block text-(length:--p-text-sub) font-semibold',
              active ? 'text-primary-foreground' : 'text-heading',
            )}
          >
            {t(labelKey as never)}
          </span>
          <span
            className={cn(
              'block text-(length:--p-text-label) leading-snug',
              active ? 'text-primary-foreground/80' : 'text-muted-foreground',
            )}
          >
            {t(hintKey as never)}
          </span>
        </span>
        {active ? (
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full bg-white/20"
            aria-hidden
          >
            <Check className="size-4" />
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()} title={t('study.modeTitle')}>
      <div className="flex flex-col gap-5">
        <SheetSection title={t('study.modeGroupFlashcard')}>{modeRow('flip')}</SheetSection>
        <SheetSection title={t('study.modeGroupRecall')}>
          <div className="flex flex-col gap-2">{recallModes.map(modeRow)}</div>
        </SheetSection>
      </div>
    </Sheet>
  )
}
