import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { Button } from '@/shared/ui'

export interface EmptyQueueProps {
  /** The queue is empty because of the Study filter, not because the Deck is finished. */
  filtered: boolean
  onChangeSelection: () => void
  onStudyAll: () => void
  onDone: () => void
}

/** No Card to show: either the Study filter matches nothing, or the Deck is caught up. */
export function EmptyQueue({ filtered, onChangeSelection, onStudyAll, onDone }: EmptyQueueProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-5 px-1 text-center">
      <div className="grid size-16 place-items-center rounded-card-featured bg-info-surface">
        <Sparkles className="size-8 text-(--rating)" aria-hidden />
      </div>
      <div>
        <h2 className="mb-1 text-(length:--p-text-headline) font-bold text-heading">
          {filtered ? t('study.nothingSelected') : t('study.allCaughtUp')}
        </h2>
        <p className="mx-auto max-w-[34ch] text-(length:--p-text-body)">
          {filtered ? t('study.nothingSelectedHint') : t('study.allCaughtUpHint')}
        </p>
      </div>
      {filtered ? (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onChangeSelection}>
            {t('study.changeSelection')}
          </Button>
          <Button onClick={onStudyAll}>{t('study.studyAllCards')}</Button>
        </div>
      ) : (
        <Button onClick={onDone}>{t('study.done')}</Button>
      )}
    </div>
  )
}
