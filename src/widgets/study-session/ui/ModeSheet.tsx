import { useTranslation } from 'react-i18next'
import { Check, WholeWord } from 'lucide-react'
import { STUDY_MODES, type StudyMode } from '@/entities/preferences'
import { cn } from '@/shared/lib'
import { Sheet } from '@/shared/ui'
import { STUDY_MODE_META } from './mode-meta'
import { ToggleRow } from './ToggleRow'

export interface ModeSheetProps {
  open: boolean
  onClose: () => void
  mode: StudyMode
  wordSpaces: boolean
  onMode: (mode: StudyMode) => void
  onWordSpaces: (value: boolean) => void
}

/** The study-mode picker: one row per mode (name + one-line hint), the active one checked.
 * Opened from the session's header mode button; picking a row switches the live session and
 * closes the sheet. The Initials word-spaces aid lives here, next to the mode it belongs to. */
export function ModeSheet({
  open,
  onClose,
  mode,
  wordSpaces,
  onMode,
  onWordSpaces,
}: ModeSheetProps) {
  const { t } = useTranslation()
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()} title={t('study.modeTitle')}>
      <div className="flex flex-col gap-2">
        {STUDY_MODES.map((candidate) => {
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
                active
                  ? 'bg-primary text-primary-foreground shadow-interactive'
                  : 'bg-info-surface',
              )}
            >
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-control',
                  active
                    ? 'bg-white/15 text-primary-foreground'
                    : 'bg-card text-primary shadow-rest',
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
              {active ? <Check className="size-5 shrink-0" aria-hidden /> : null}
            </button>
          )
        })}
        {mode === 'initials' ? (
          <ToggleRow
            icon={<WholeWord className="size-[18px]" aria-hidden />}
            label={t('study.wordSpaces')}
            description={t('study.wordSpacesHint')}
            checked={wordSpaces}
            onChange={onWordSpaces}
          />
        ) : null}
      </div>
    </Sheet>
  )
}
