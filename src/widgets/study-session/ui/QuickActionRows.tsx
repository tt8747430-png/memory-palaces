import { useTranslation } from 'react-i18next'
import { Flag, Pencil, RotateCcw, SkipForward, Undo2, Volume2 } from 'lucide-react'

export interface QuickActionsModel {
  flagged: boolean
  canEdit: boolean
  canSpeak: boolean
  canUndo: boolean
  onUndo: () => void
  onFlag: () => void
  onEdit: () => void
  onSpeak: () => void
  onSkip: () => void
  onRestart: () => void
}

const ROW =
  'flex w-full items-center gap-3.5 rounded-card bg-info-surface px-4 py-3.5 text-[length:var(--p-text-body)] font-semibold text-heading transition-transform active:scale-[0.99] disabled:opacity-50'

export function QuickActionRows({
  model,
  after,
}: {
  model: QuickActionsModel
  after?: () => void
}) {
  const { t } = useTranslation()
  const {
    flagged,
    canEdit,
    canSpeak,
    canUndo,
    onUndo,
    onFlag,
    onEdit,
    onSpeak,
    onSkip,
    onRestart,
  } = model
  const run = (action: () => void) => () => {
    action()
    after?.()
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={run(onUndo)} disabled={!canUndo} className={ROW}>
        <Undo2 className="size-[19px]" aria-hidden />
        {t('study.undoLast')}
      </button>
      <button type="button" onClick={run(onFlag)} disabled={!canEdit} className={ROW}>
        <Flag
          className={
            flagged ? 'size-[19px] fill-[var(--rating)] text-[var(--rating-edge)]' : 'size-[19px]'
          }
          aria-hidden
        />
        {flagged ? t('study.removeFlag') : t('study.flagThis')}
      </button>
      <button type="button" onClick={run(onEdit)} disabled={!canEdit} className={ROW}>
        <Pencil className="size-[19px]" aria-hidden />
        {t('study.editCard')}
      </button>
      {canSpeak ? (
        <button type="button" onClick={run(onSpeak)} className={ROW}>
          <Volume2 className="size-[19px]" aria-hidden />
          {t('study.readAloud')}
        </button>
      ) : null}
      <button type="button" onClick={run(onSkip)} className={ROW}>
        <SkipForward className="size-[19px]" aria-hidden />
        {t('study.skipForNow')}
      </button>
      <button type="button" onClick={run(onRestart)} className={ROW}>
        <RotateCcw className="size-[19px]" aria-hidden />
        {t('study.restartSession')}
      </button>
    </div>
  )
}
