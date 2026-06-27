import { useTranslation } from 'react-i18next'
import { Flag, Pencil, RotateCcw, SkipForward, Volume2 } from 'lucide-react'
import { Sheet } from '@/shared/ui'

export interface QuickActionsSheetProps {
  open: boolean
  onClose: () => void
  flagged: boolean
  canEdit: boolean
  canSpeak: boolean
  onFlag: () => void
  onEdit: () => void
  onSpeak: () => void
  onSkip: () => void
  onRestart: () => void
}

const row =
  'flex w-full items-center gap-3.5 rounded-card bg-info-surface px-4 py-3.5 text-[length:var(--p-text-body)] font-semibold text-heading transition-transform active:scale-[0.99] disabled:opacity-50'

/** Press-and-hold quick actions for the active card — flag, edit, listen, skip,
 * restart — each dismissing the sheet on choice. */
export function QuickActionsSheet({
  open,
  onClose,
  flagged,
  canEdit,
  canSpeak,
  onFlag,
  onEdit,
  onSpeak,
  onSkip,
  onRestart,
}: QuickActionsSheetProps) {
  const { t } = useTranslation()
  const run = (action: () => void) => () => {
    action()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()} title={t('study.quickActions')}>
      <div className="space-y-2 pb-2">
        <button type="button" onClick={run(onFlag)} disabled={!canEdit} className={row}>
          <Flag
            className={flagged ? 'size-[19px] fill-[var(--rating)] text-[var(--rating-edge)]' : 'size-[19px]'}
            aria-hidden
          />
          {flagged ? t('study.removeFlag') : t('study.flagThis')}
        </button>
        <button type="button" onClick={run(onEdit)} disabled={!canEdit} className={row}>
          <Pencil className="size-[19px]" aria-hidden />
          {t('study.editCard')}
        </button>
        {canSpeak && (
          <button type="button" onClick={run(onSpeak)} className={row}>
            <Volume2 className="size-[19px]" aria-hidden />
            {t('study.readAloud')}
          </button>
        )}
        <button type="button" onClick={run(onSkip)} className={row}>
          <SkipForward className="size-[19px]" aria-hidden />
          {t('study.skipForNow')}
        </button>
        <button type="button" onClick={run(onRestart)} className={row}>
          <RotateCcw className="size-[19px]" aria-hidden />
          {t('study.restartSession')}
        </button>
      </div>
    </Sheet>
  )
}
